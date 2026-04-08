package clipboard

import (
	"os/exec"

	"github.com/charmbracelet/log"
)

type ClipboardService struct {
	history *History
	monitor *Monitor
}

func NewClipboardService() *ClipboardService {
	history := NewHistory()
	history.Load()

	return &ClipboardService{
		history: history,
		monitor: NewMonitor(history),
	}
}

func (cs *ClipboardService) GetHistory() []ClipboardEntry {
	return cs.history.GetAll()
}

func (cs *ClipboardService) ClearHistory() {
	cs.history.Clear()
}

func (cs *ClipboardService) DeleteEntry(id string) error {
	return cs.history.Delete(id)
}

func (cs *ClipboardService) CopyToClipboard(id string) error {
	entry := cs.history.GetByID(id)
	if entry == nil {
		return nil
	}

	cmd := exec.Command("wl-copy", entry.Content)
	err := cmd.Start()
	if err != nil {
		log.Error("Failed to copy to clipboard", "error", err)
		return err
	}

	return nil
}

func (cs *ClipboardService) IsAvailable() bool {
	return IsWlPasteAvailable()
}

func (cs *ClipboardService) IsMonitoring() bool {
	return cs.monitor.IsRunning()
}

func (cs *ClipboardService) StartMonitor() error {
	return cs.monitor.Start()
}

func (cs *ClipboardService) StopMonitor() {
	cs.monitor.Stop()
}
