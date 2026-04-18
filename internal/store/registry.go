package store

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"time"
)

const (
	registryVersion = 1
)

type RegistryManager struct {
	mu       sync.RWMutex
	registry Registry
	path     string
}

func NewRegistryManager() *RegistryManager {
	return &RegistryManager{
		path: getRegistryPath(),
		registry: Registry{
			Version:    registryVersion,
			Extensions: make(map[string]InstalledExt),
		},
	}
}

func getExtensionDir() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".local", "share", "clutch", "extensions")
}

func getRegistryPath() string {
	return filepath.Join(getExtensionDir(), "registry.json")
}

func (r *RegistryManager) Load() error {
	r.mu.Lock()
	defer r.mu.Unlock()

	data, err := os.ReadFile(r.path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	return json.Unmarshal(data, &r.registry)
}

func (r *RegistryManager) Save() error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if err := os.MkdirAll(filepath.Dir(r.path), 0755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(r.registry, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(r.path, data, 0644)
}

func (r *RegistryManager) Add(name string, ext InstalledExt) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.registry.Extensions[name] = ext
	return nil
}

func (r *RegistryManager) Remove(name string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	delete(r.registry.Extensions, name)
	return nil
}

func (r *RegistryManager) Get(name string) (*InstalledExt, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	ext, ok := r.registry.Extensions[name]
	if !ok {
		return nil, false
	}
	return &ext, true
}

func (r *RegistryManager) List() []InstalledExt {
	r.mu.RLock()
	defer r.mu.RUnlock()

	result := make([]InstalledExt, 0, len(r.registry.Extensions))
	for _, ext := range r.registry.Extensions {
		result = append(result, ext)
	}
	return result
}

func (r *RegistryManager) Exists(name string) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()

	_, ok := r.registry.Extensions[name]
	return ok
}

func (r *RegistryManager) GetExtensionPath(name string) string {
	return filepath.Join(getExtensionDir(), name)
}

func NewInstalledExt(ext Extension, path string) InstalledExt {
	return InstalledExt{
		ID:          ext.ID,
		Name:        ext.Name,
		Title:       ext.Title,
		Author:      ext.Author.Name,
		InstalledAt: time.Now(),
		Path:        path,
		Commands:    ext.Commands,
		Icons:       ext.Icons,
	}
}
