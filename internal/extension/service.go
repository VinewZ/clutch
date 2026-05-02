package extension

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/charmbracelet/log"
	"github.com/vinewz/clutch/internal/actions"
	"github.com/vinewz/clutch/internal/socket"
	"github.com/vinewz/clutch/internal/store"
)

type ExtensionService struct {
	mu               sync.RWMutex
	lifecycle        *socket.LifecycleManager
	registry         *store.RegistryManager
	activeExt        *Extension
	lastRender       json.RawMessage
	onRender         func(json.RawMessage)
	onError          func(error)
	onToast          func(map[string]any)
	socketPath       string
	socketServer     *socket.Server
	actionDispatcher *actions.Dispatcher
	runtimeReady     chan struct{}
}

func NewExtensionService(socketPath string) *ExtensionService {
	return &ExtensionService{
		lifecycle:        socket.NewLifecycleManager(socketPath),
		registry:         store.NewRegistryManager(),
		socketPath:       socketPath,
		actionDispatcher: actions.NewDispatcher(),
	}
}

func (s *ExtensionService) NotifyRuntimeConnected(extensionID string) {
	s.mu.RLock()
	active := s.activeExt
	s.mu.RUnlock()

	if active != nil && active.ID == extensionID {
		select {
		case s.runtimeReady <- struct{}{}:
			log.Warn("[NotifyRuntimeConnected] signaled readiness", "extensionId", extensionID)
		default:
		}
	}
}

func (s *ExtensionService) StartExtension(name, command string) (*Extension, error) {
	s.mu.Lock()

	extID := fmt.Sprintf("%s-%s", name, command)

	if s.activeExt != nil && s.activeExt.ID == extID && s.socketServer.IsRuntimeConnected(extID) {
		ext := s.activeExt
		s.mu.Unlock()
		log.Warn("[StartExtension] same extension already running and connected", "extensionId", extID)
		return ext, nil
	}

	if s.activeExt != nil {
		oldExt := s.activeExt
		s.activeExt = nil
		s.lastRender = nil
		oldReady := s.runtimeReady
		s.runtimeReady = make(chan struct{}, 1)
		s.mu.Unlock()
		if oldExt.ID == extID {
			s.lifecycle.CancelRuntime(oldExt.ID)
		} else {
			go func() {
				s.lifecycle.StopRuntime(oldExt.ID)
				if oldReady != nil {
					close(oldReady)
				}
			}()
		}
		s.mu.Lock()
	} else {
		s.runtimeReady = make(chan struct{}, 1)
	}

	if err := s.registry.Load(); err != nil {
		s.mu.Unlock()
		log.Error("Failed to load registry", "error", err)
		return nil, fmt.Errorf("load registry: %w", err)
	}

	installed, ok := s.registry.Get(name)
	if !ok {
		s.mu.Unlock()
		log.Error("Extension not found in registry", "name", name)
		return nil, fmt.Errorf("extension %s not found in registry", name)
	}

	ext := &Extension{
		ID:      extID,
		Name:    name,
		Path:    installed.Path,
		Command: command,
	}

	s.activeExt = ext
	ready := s.runtimeReady
	s.mu.Unlock()

	preferences := s.resolvePreferences(installed)

	if err := s.lifecycle.StartRuntimeWithPreferences(ext.ID, ext.Path, ext.Command, preferences); err != nil {
		s.mu.Lock()
		s.activeExt = nil
		s.mu.Unlock()
		log.Error("Failed to start runtime", "error", err)
		return nil, err
	}

	select {
	case <-ready:
		log.Warn("[StartExtension] runtime connected", "extensionId", ext.ID)
	case <-time.After(5 * time.Second):
		log.Warn("[StartExtension] timed out waiting for runtime connection", "extensionId", ext.ID)
	}

	log.Info("Extension started", "extensionId", ext.ID, "name", name, "command", command)
	return ext, nil
}

func (s *ExtensionService) resolvePreferences(installed *store.InstalledExt) map[string]interface{} {
	if installed.PreferenceValues != nil && len(installed.PreferenceValues) > 0 {
		return installed.PreferenceValues
	}

	if installed.PreferenceSchema != nil && len(installed.PreferenceSchema) > 0 {
		defaults := make(map[string]interface{})
		for _, schema := range installed.PreferenceSchema {
			if schema.Default != nil {
				defaults[schema.Name] = schema.Default
			}
		}
		return defaults
	}

	return nil
}

func (s *ExtensionService) StopExtension() error {
	s.mu.Lock()
	if s.activeExt == nil {
		s.mu.Unlock()
		return nil
	}

	ext := s.activeExt
	s.activeExt = nil
	s.lastRender = nil
	oldReady := s.runtimeReady
	s.runtimeReady = nil
	s.mu.Unlock()

	log.Warn("[StopExtension] stopping runtime", "extensionId", ext.ID)
	go func() {
		s.lifecycle.StopRuntime(ext.ID)
		if oldReady != nil {
			close(oldReady)
		}
	}()
	return nil
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

func (s *ExtensionService) SendEvent(handlerID string, event string) error {
	extID, err := s.waitForRuntime(handlerID)
	if err != nil {
		return err
	}

	s.mu.RLock()
	socketSrv := s.socketServer
	s.mu.RUnlock()

	if socketSrv == nil {
		log.Error("[SendEvent] socket server not configured", "handlerId", handlerID)
		return fmt.Errorf("socket server not configured")
	}

	rawEvent := json.RawMessage(event)
	log.Warn("[SendEvent] sending event to runtime", "handlerId", handlerID, "extensionId", extID, "event", event)

	msg := socket.RuntimeEventMessage{
		Category:    socket.CategoryRuntime,
		Type:        "event",
		ExtensionID: extID,
		HandlerID:   handlerID,
		Event:       rawEvent,
	}

	err = socketSrv.SendToRuntime(extID, msg)
	if err != nil {
		log.Error("[SendEvent] SendToRuntime failed", "handlerId", handlerID, "error", err)
	} else {
		log.Warn("[SendEvent] SendToRuntime succeeded", "handlerId", handlerID)
	}
	return err
}

func (s *ExtensionService) waitForRuntime(handlerID string) (string, error) {
	for i := 0; i < 10; i++ {
		s.mu.RLock()
		ext := s.activeExt
		socketSrv := s.socketServer
		s.mu.RUnlock()

		if ext == nil {
			return "", fmt.Errorf("no active extension")
		}

		if socketSrv != nil && socketSrv.IsRuntimeConnected(ext.ID) {
			return ext.ID, nil
		}

		if i < 9 {
			time.Sleep(50 * time.Millisecond)
		}
	}

	s.mu.RLock()
	ext := s.activeExt
	s.mu.RUnlock()

	if ext == nil {
		return "", fmt.Errorf("no active extension")
	}
	return ext.ID, fmt.Errorf("runtime not connected: %s", ext.ID)
}

func (s *ExtensionService) SendAction(actionType string, propsJSON string, handlerID string) error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if s.activeExt == nil {
		return fmt.Errorf("no active extension")
	}

	var props map[string]interface{}
	if err := json.Unmarshal(json.RawMessage(propsJSON), &props); err != nil {
		return fmt.Errorf("parse action props: %w", err)
	}

	result := s.actionDispatcher.Dispatch(actionType, props)

	if result.Error != nil {
		log.Error("Built-in action failed", "action", actionType, "error", result.Error)
		if s.onToast != nil {
			s.onToast(map[string]any{
				"type":    "toastShow",
				"title":   "Action Failed",
				"message": result.Error.Error(),
				"style":   "failure",
			})
		}
	} else if result.Message != "" {
		if s.onToast != nil {
			s.onToast(map[string]any{
				"type":    "toastShow",
				"title":   result.Title,
				"message": result.Message,
				"style":   "success",
			})
		}
	}

	if handlerID != "" && s.socketServer != nil {
		msg := socket.RuntimeEventMessage{
			Category:    socket.CategoryRuntime,
			Type:        "event",
			ExtensionID: s.activeExt.ID,
			HandlerID:   handlerID,
			Event:       json.RawMessage(`{}`),
		}
		return s.socketServer.SendToRuntime(s.activeExt.ID, msg)
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

func (s *ExtensionService) SetOnToast(fn func(map[string]any)) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.onToast = fn
}

func (s *ExtensionService) HandleToastMessage(data json.RawMessage) {
	s.mu.RLock()
	callback := s.onToast
	s.mu.RUnlock()

	if callback == nil {
		return
	}

	var parsed map[string]any
	if err := json.Unmarshal(data, &parsed); err != nil {
		log.Error("Failed to parse toast message", "error", err)
		return
	}
	callback(parsed)
}

func (s *ExtensionService) HandleRenderResponse(data json.RawMessage) {
	s.mu.Lock()
	s.lastRender = data
	callback := s.onRender
	s.mu.Unlock()

	log.Info("[HandleRenderResponse] received render", "dataLen", len(data))

	if callback != nil {
		callback(data)
	} else {
		log.Warn("[HandleRenderResponse] no onRender callback set")
	}
}

func (s *ExtensionService) GetLifecycle() *socket.LifecycleManager {
	return s.lifecycle
}

func (s *ExtensionService) SetSocketServer(srv *socket.Server) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.socketServer = srv
}

func (s *ExtensionService) NavigationPop() error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if s.activeExt == nil {
		return fmt.Errorf("no active extension")
	}

	if s.socketServer == nil {
		return fmt.Errorf("socket server not configured")
	}

	msg := socket.NavigationPopMessage{
		Category:    socket.CategoryRuntime,
		Type:        "navigationPop",
		ExtensionID: s.activeExt.ID,
	}

	return s.socketServer.SendToRuntime(s.activeExt.ID, msg)
}
