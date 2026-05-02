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

func ExtractPreferences(extPath string, command string) ([]PreferenceSchema, map[string]interface{}) {
	pkgPath := filepath.Join(extPath, "package.json")
	data, err := os.ReadFile(pkgPath)
	if err != nil {
		return nil, nil
	}

	var pkg struct {
		Commands []struct {
			Name        string `json:"name"`
			Preferences []struct {
				Name        string      `json:"name"`
				Type        string      `json:"type"`
				Default     interface{} `json:"default"`
				Required    bool        `json:"required"`
				Title       string      `json:"title"`
				Description string      `json:"description"`
			} `json:"preferences"`
		} `json:"commands"`
		Preferences []struct {
			Name        string      `json:"name"`
			Type        string      `json:"type"`
			Default     interface{} `json:"default"`
			Required    bool        `json:"required"`
			Title       string      `json:"title"`
			Description string      `json:"description"`
		} `json:"preferences"`
	}

	if err := json.Unmarshal(data, &pkg); err != nil {
		return nil, nil
	}

	var schemas []PreferenceSchema
	defaults := make(map[string]interface{})

	for _, p := range pkg.Preferences {
		schemas = append(schemas, PreferenceSchema{
			Name:        p.Name,
			Type:        p.Type,
			Default:     p.Default,
			Required:    p.Required,
			Title:       p.Title,
			Description: p.Description,
		})
		if p.Default != nil {
			defaults[p.Name] = p.Default
		}
	}

	for _, cmd := range pkg.Commands {
		if cmd.Name == command {
			for _, p := range cmd.Preferences {
				schemas = append(schemas, PreferenceSchema{
					Name:        p.Name,
					Type:        p.Type,
					Default:     p.Default,
					Required:    p.Required,
					Title:       p.Title,
					Description: p.Description,
				})
				if p.Default != nil {
					defaults[p.Name] = p.Default
				}
			}
		}
	}

	if len(schemas) == 0 {
		return nil, nil
	}

	return schemas, defaults
}
