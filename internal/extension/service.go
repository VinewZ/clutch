package extension

import (
	"encoding/json"
	"fmt"
	"sync"

	"github.com/charmbracelet/log"
	"github.com/vinewz/clutch/internal/socket"
	"github.com/vinewz/clutch/internal/store"
)

type ExtensionService struct {
	mu         sync.RWMutex
	lifecycle  *socket.LifecycleManager
	registry   *store.RegistryManager
	activeExt  *Extension
	lastRender json.RawMessage
	onRender   func(json.RawMessage)
	onError    func(error)
	socketPath string
}

func NewExtensionService(socketPath string) *ExtensionService {
	return &ExtensionService{
		lifecycle:  socket.NewLifecycleManager(socketPath),
		registry:   store.NewRegistryManager(),
		socketPath: socketPath,
	}
}

func (s *ExtensionService) StartExtension(name, command string) (*Extension, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	log.Debug("StartExtension called", "name", name, "command", command)

	if err := s.registry.Load(); err != nil {
		log.Error("Failed to load registry", "error", err)
		return nil, fmt.Errorf("load registry: %w", err)
	}
	log.Debug("Registry loaded successfully")

	installed, ok := s.registry.Get(name)
	if !ok {
		log.Error("Extension not found in registry", "name", name)
		return nil, fmt.Errorf("extension %s not found in registry", name)
	}
	log.Debug("Found extension in registry", "name", name, "path", installed.Path, "commands", len(installed.Commands))

	ext := &Extension{
		ID:      fmt.Sprintf("%s-%s", name, command),
		Name:    name,
		Path:    installed.Path,
		Command: command,
	}

	log.Debug("Starting runtime process", "extensionId", ext.ID, "path", ext.Path, "command", ext.Command)
	if err := s.lifecycle.StartRuntime(ext.ID, ext.Path, ext.Command); err != nil {
		log.Error("Failed to start runtime", "error", err)
		return nil, err
	}

	log.Info("Extension started", "extensionId", ext.ID, "name", name, "command", command)
	s.activeExt = ext
	return ext, nil
}

func (s *ExtensionService) StopExtension() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.activeExt == nil {
		return nil
	}

	log.Debug("StopExtension called", "extensionId", s.activeExt.ID)
	err := s.lifecycle.StopRuntime(s.activeExt.ID)
	s.activeExt = nil
	s.lastRender = nil

	return err
}

func (s *ExtensionService) GetActiveExtension() *Extension {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.activeExt
}

func (s *ExtensionService) GetLastRender() json.RawMessage {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.lastRender
}

func (s *ExtensionService) SendEvent(handlerID string, event json.RawMessage) error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if s.activeExt == nil {
		return fmt.Errorf("no active extension")
	}

	return nil
}

func (s *ExtensionService) SetOnRender(fn func(map[string]any)) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.onRender = func(data json.RawMessage) {
		var parsed map[string]any
		if err := json.Unmarshal(data, &parsed); err != nil {
			log.Error("Failed to parse render data", "error", err)
			return
		}
		fn(parsed)
	}
}

func (s *ExtensionService) SetOnError(fn func(string)) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.onError = func(err error) {
		fn(err.Error())
	}
}

func (s *ExtensionService) HandleRenderResponse(data json.RawMessage) {
	s.mu.Lock()
	s.lastRender = data
	callback := s.onRender
	s.mu.Unlock()

	if callback != nil {
		callback(data)
	}
}

func (s *ExtensionService) GetLifecycle() *socket.LifecycleManager {
	return s.lifecycle
}
