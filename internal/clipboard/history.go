package clipboard

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/google/uuid"
)

type ClipboardEntry struct {
	ID        string `json:"id"`
	Content   string `json:"content"`
	MIMEType  string `json:"mimeType"`
	Size      int    `json:"size"`
	Timestamp string `json:"timestamp"`
}

type History struct {
	mu       sync.RWMutex
	entries  []ClipboardEntry
	maxSize  int
	filePath string
}

func NewHistory() *History {
	dir := filepath.Join(os.Getenv("HOME"), ".local", "share", "clutch")
	os.MkdirAll(dir, 0755)

	return &History{
		entries:  []ClipboardEntry{},
		maxSize:  50,
		filePath: filepath.Join(dir, "clipboard.json"),
	}
}

func (h *History) Load() error {
	h.mu.Lock()
	defer h.mu.Unlock()

	data, err := os.ReadFile(h.filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	return json.Unmarshal(data, &h.entries)
}

func (h *History) Save() error {
	h.mu.RLock()
	defer h.mu.RUnlock()

	data, err := json.MarshalIndent(h.entries, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(h.filePath, data, 0644)
}

func (h *History) Add(content, mimeType string) {
	if content == "" {
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	for i, e := range h.entries {
		if e.Content == content {
			e.Timestamp = time.Now().Format(time.RFC3339)
			h.entries = append(h.entries[:i], h.entries[i+1:]...)
			h.entries = append([]ClipboardEntry{e}, h.entries...)
			h.saveAsync()
			return
		}
	}

	entry := ClipboardEntry{
		ID:        uuid.New().String(),
		Content:   content,
		MIMEType:  mimeType,
		Size:      len(content),
		Timestamp: time.Now().Format(time.RFC3339),
	}

	h.entries = append([]ClipboardEntry{entry}, h.entries...)

	if len(h.entries) > h.maxSize {
		h.entries = h.entries[:h.maxSize]
	}

	h.saveAsync()
}

func (h *History) saveAsync() {
	go func() {
		data, err := json.MarshalIndent(h.entries, "", "  ")
		if err != nil {
			return
		}
		os.WriteFile(h.filePath, data, 0644)
	}()
}

func (h *History) GetAll() []ClipboardEntry {
	h.mu.RLock()
	defer h.mu.RUnlock()

	result := make([]ClipboardEntry, len(h.entries))
	copy(result, h.entries)
	return result
}

func (h *History) Clear() {
	h.mu.Lock()
	defer h.mu.Unlock()

	h.entries = []ClipboardEntry{}
	h.saveAsync()
}

func (h *History) Delete(id string) error {
	h.mu.Lock()
	defer h.mu.Unlock()

	for i, e := range h.entries {
		if e.ID == id {
			h.entries = append(h.entries[:i], h.entries[i+1:]...)
			h.saveAsync()
			return nil
		}
	}

	return nil
}

func (h *History) GetByID(id string) *ClipboardEntry {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, e := range h.entries {
		if e.ID == id {
			return &e
		}
	}
	return nil
}
