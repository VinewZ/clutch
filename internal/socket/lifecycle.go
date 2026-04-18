package socket

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"sync"
	"time"

	"github.com/charmbracelet/log"
	"github.com/vinewz/clutch/internal/runtime"
)

type ExtensionRuntime struct {
	ExtensionID      string
	ExtensionPath    string
	ExtensionCommand string
	Process          *exec.Cmd
	cancel           context.CancelFunc
}

type LifecycleManager struct {
	socketPath string
	mu         sync.RWMutex
	runtimes   map[string]*ExtensionRuntime
}

func NewLifecycleManager(socketPath string) *LifecycleManager {
	return &LifecycleManager{
		socketPath: socketPath,
		runtimes:   make(map[string]*ExtensionRuntime),
	}
}

func (lm *LifecycleManager) StartRuntime(extensionId, extensionPath, command string) error {
	lm.mu.Lock()
	defer lm.mu.Unlock()

	log.Debug("StartRuntime called", "extensionId", extensionId, "extensionPath", extensionPath, "command", command)

	if _, exists := lm.runtimes[extensionId]; exists {
		log.Warn("Extension runtime already running, stopping it first", "extensionId", extensionId)
		lm.stopRuntimeUnsafe(extensionId)
	}

	runtimePath := runtime.GetRuntimePath()
	if runtimePath == "" {
		log.Error("Runtime not initialized - GetRuntimePath returned empty string")
		return fmt.Errorf("runtime not initialized")
	}
	log.Debug("Runtime path resolved", "runtimePath", runtimePath)

	ctx, cancel := context.WithCancel(context.Background())

	cmd := exec.CommandContext(ctx,
		"node", runtimePath,
		"--socket", lm.socketPath,
		"--extension-id", extensionId,
		"--extension-path", extensionPath,
		"--command", command,
	)

	log.Debug("Executing command", "cmd", cmd.String())

	cmd.Env = append(os.Environ(),
		"EXTENSION_ID="+extensionId,
		"EXTENSION_PATH="+extensionPath,
		"EXTENSION_COMMAND="+command,
	)

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		cancel()
		log.Error("Failed to create stdout pipe", "error", err)
		return fmt.Errorf("create stdout pipe: %w", err)
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		cancel()
		log.Error("Failed to create stderr pipe", "error", err)
		return fmt.Errorf("create stderr pipe: %w", err)
	}

	if err := cmd.Start(); err != nil {
		cancel()
		log.Error("Failed to start ext-runtime process", "error", err)
		return fmt.Errorf("start ext-runtime: %w", err)
	}

	extRuntime := &ExtensionRuntime{
		ExtensionID:      extensionId,
		ExtensionPath:    extensionPath,
		ExtensionCommand: command,
		Process:          cmd,
		cancel:           cancel,
	}
	lm.runtimes[extensionId] = extRuntime

	go lm.pipeOutput(stdout, extensionId, "stdout")
	go lm.pipeOutput(stderr, extensionId, "stderr")
	go lm.monitorProcess(cmd, extensionId)

	log.Info("Extension runtime process started", "extensionId", extensionId, "pid", cmd.Process.Pid)
	return nil
}

func (lm *LifecycleManager) pipeOutput(reader io.Reader, extensionId, stream string) {
	scanner := bufio.NewScanner(reader)
	for scanner.Scan() {
		line := scanner.Text()
		if stream == "stderr" {
			log.Info("[ext-runtime]", "extensionId", extensionId, "stream", stream, "output", line)
		} else {
			log.Debug("[ext-runtime]", "extensionId", extensionId, "stream", stream, "output", line)
		}
	}
	if err := scanner.Err(); err != nil {
		log.Debug("Output scanner error", "extensionId", extensionId, "stream", stream, "error", err)
	}
}

func (lm *LifecycleManager) monitorProcess(cmd *exec.Cmd, extensionId string) {
	err := cmd.Wait()
	lm.mu.Lock()
	defer lm.mu.Unlock()

	delete(lm.runtimes, extensionId)

	exitCode := 0
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		}
		log.Warn("Extension runtime process exited with error",
			"extensionId", extensionId,
			"error", err,
			"exitCode", exitCode)
	} else {
		log.Info("Extension runtime process exited cleanly", "extensionId", extensionId)
	}
}

func (lm *LifecycleManager) stopRuntimeUnsafe(extensionId string) error {
	extRuntime, exists := lm.runtimes[extensionId]
	if !exists {
		return nil
	}

	if extRuntime.cancel != nil {
		extRuntime.cancel()
	}

	if extRuntime.Process != nil && extRuntime.Process.Process != nil {
		done := make(chan error, 1)
		go func() {
			done <- extRuntime.Process.Wait()
		}()

		select {
		case <-done:
		case <-time.After(5 * time.Second):
			log.Warn("Extension runtime did not stop gracefully, killing", "extensionId", extensionId)
			extRuntime.Process.Process.Kill()
		}
	}

	delete(lm.runtimes, extensionId)
	return nil
}

func (lm *LifecycleManager) StopRuntime(extensionId string) error {
	lm.mu.Lock()
	defer lm.mu.Unlock()

	log.Debug("StopRuntime called", "extensionId", extensionId)
	return lm.stopRuntimeUnsafe(extensionId)
}

func (lm *LifecycleManager) StopAllRuntimes() {
	lm.mu.Lock()
	defer lm.mu.Unlock()

	log.Debug("StopAllRuntimes called", "count", len(lm.runtimes))

	var wg sync.WaitGroup
	for id := range lm.runtimes {
		wg.Add(1)
		go func(extensionId string) {
			defer wg.Done()
			lm.stopRuntimeUnsafe(extensionId)
		}(id)
	}
	wg.Wait()
}

func (lm *LifecycleManager) IsRunning(extensionId string) bool {
	lm.mu.RLock()
	defer lm.mu.RUnlock()

	_, exists := lm.runtimes[extensionId]
	return exists
}

func (lm *LifecycleManager) GetRuntime(extensionId string) *ExtensionRuntime {
	lm.mu.RLock()
	defer lm.mu.RUnlock()

	if extRuntime, exists := lm.runtimes[extensionId]; exists {
		return extRuntime
	}
	return nil
}

type InternalMessageHandler struct {
	lifecycle *LifecycleManager
}

func NewInternalMessageHandler(lifecycle *LifecycleManager) *InternalMessageHandler {
	return &InternalMessageHandler{
		lifecycle: lifecycle,
	}
}

func (h *InternalMessageHandler) Handle(data json.RawMessage) (*SocketResponse, error) {
	var base BaseMessage
	if err := json.Unmarshal(data, &base); err != nil {
		return nil, fmt.Errorf("parse message: %w", err)
	}

	switch base.Type {
	case "runtimeStart":
		return h.handleRuntimeStart(data)
	case "runtimeStop":
		return h.handleRuntimeStop(data)
	default:
		return &SocketResponse{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UNKNOWN_TYPE",
				Message: "unknown INTERNAL type: " + base.Type,
			},
		}, nil
	}
}

func (h *InternalMessageHandler) handleRuntimeStart(data json.RawMessage) (*SocketResponse, error) {
	var msg RuntimeStartMessage
	if err := json.Unmarshal(data, &msg); err != nil {
		return nil, fmt.Errorf("parse runtime start: %w", err)
	}

	if err := h.lifecycle.StartRuntime(msg.ExtensionID, msg.ExtensionPath, msg.ExtensionCommand); err != nil {
		return &SocketResponse{
			Success: false,
			Error: &ErrorInfo{
				Code:    "START_ERROR",
				Message: err.Error(),
			},
		}, nil
	}

	responseData, _ := json.Marshal(map[string]string{
		"extensionId": msg.ExtensionID,
	})

	return &SocketResponse{
		Success: true,
		Data:    responseData,
	}, nil
}

func (h *InternalMessageHandler) handleRuntimeStop(data json.RawMessage) (*SocketResponse, error) {
	var msg RuntimeStopMessage
	if err := json.Unmarshal(data, &msg); err != nil {
		return nil, fmt.Errorf("parse runtime stop: %w", err)
	}

	if err := h.lifecycle.StopRuntime(msg.ExtensionID); err != nil {
		return &SocketResponse{
			Success: false,
			Error: &ErrorInfo{
				Code:    "STOP_ERROR",
				Message: err.Error(),
			},
		}, nil
	}

	return &SocketResponse{
		Success: true,
	}, nil
}
