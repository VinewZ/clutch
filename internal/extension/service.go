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
	mu           sync.RWMutex
	lifecycle    *socket.LifecycleManager
	registry     *store.RegistryManager
	activeExt    *Extension
	lastRender   json.RawMessage
	onRender     func(json.RawMessage)
	onError      func(error)
	onToast      func(map[string]any)
	socketPath   string
	socketServer *socket.Server
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

	// Resolve preferences: user values -> schema defaults -> empty
	preferences := s.resolvePreferences(installed)

	if err := s.lifecycle.StartRuntimeWithPreferences(ext.ID, ext.Path, ext.Command, preferences); err != nil {
		log.Error("Failed to start runtime", "error", err)
		return nil, err
	}

	log.Info("Extension started", "extensionId", ext.ID, "name", name, "command", command)
	s.activeExt = ext
	return ext, nil
}

func (s *ExtensionService) resolvePreferences(installed *store.InstalledExt) map[string]interface{} {
	// Start with user-set values
	if installed.PreferenceValues != nil && len(installed.PreferenceValues) > 0 {
		log.Debug("Using user-set preferences", "count", len(installed.PreferenceValues))
		return installed.PreferenceValues
	}

	// Fall back to schema defaults
	if installed.PreferenceSchema != nil && len(installed.PreferenceSchema) > 0 {
		defaults := make(map[string]interface{})
		for _, schema := range installed.PreferenceSchema {
			if schema.Default != nil {
				defaults[schema.Name] = schema.Default
			}
		}
		log.Debug("Using default preferences from schema", "count", len(defaults))
		return defaults
	}

	// No preferences defined
	log.Debug("No preferences defined for extension")
	return nil
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

	if callback != nil {
		callback(data)
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
