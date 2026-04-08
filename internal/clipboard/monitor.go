package clipboard

import (
	"bufio"
	"errors"
	"os/exec"
	"strings"
	"sync/atomic"

	"github.com/charmbracelet/log"
	"github.com/wailsapp/wails/v3/pkg/application"
)

var wlPasteAvailable bool

func init() {
	_, err := exec.LookPath("wl-paste")
	wlPasteAvailable = err == nil
	if !wlPasteAvailable {
		log.Warn("wl-clipboard not found. Install with: sudo apt install wl-clipboard")
	}
}

func IsWlPasteAvailable() bool {
	return wlPasteAvailable
}

type Monitor struct {
	history  *History
	running  atomic.Bool
	stopChan chan struct{}
}

func NewMonitor(history *History) *Monitor {
	return &Monitor{
		history:  history,
		stopChan: make(chan struct{}),
	}
}

func (m *Monitor) Start() error {
	if !wlPasteAvailable {
		return errors.New("wl-paste not available")
	}

	if m.running.Load() {
		return nil
	}

	log.Info("Starting clipboard monitor")

	cmd := exec.Command("wl-paste", "--watch", "cat")
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}

	if err := cmd.Start(); err != nil {
		return err
	}

	m.running.Store(true)

	go func() {
		buffer := make([]byte, 1024*1024)
		for {
			select {
			case <-m.stopChan:
				return
			default:
				n, err := stdout.Read(buffer)
				if err != nil {
					return
				}
				content := strings.TrimSpace(string(buffer[:n]))
				if content == "" {
					continue
				}
				mimeType := m.getMIMETypes()
				log.Info("Clipboard entry detected", "size", len(content), "mime", mimeType, "content", content)
				m.history.Add(content, mimeType)
				if app := application.Get(); app != nil {
					app.Event.Emit("clipboard:new", content)
				}
			}
		}
	}()

	go func() {
		<-m.stopChan
		cmd.Process.Kill()
		cmd.Wait()
	}()

	return nil
}

func (m *Monitor) Stop() {
	if !m.running.Load() {
		return
	}

	log.Info("Stopping clipboard monitor")
	close(m.stopChan)
	m.running.Store(false)
	m.stopChan = make(chan struct{})
}

func (m *Monitor) getMIMETypes() string {
	cmd := exec.Command("wl-paste", "--list-types")
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return "text/plain"
	}

	if err := cmd.Start(); err != nil {
		return "text/plain"
	}

	scanner := bufio.NewScanner(stdout)
	if scanner.Scan() {
		return scanner.Text()
	}

	return "text/plain"
}

func (m *Monitor) IsRunning() bool {
	return m.running.Load()
}
