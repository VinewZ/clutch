package app

import (
	"fmt"
	"os/exec"
)

func (s *ClutchServices) UseShell(appName, cmdStr string) (string, error) {
	s.mu.Lock()
	if s.confirmCh != nil {
		s.mu.Unlock()
		return "", fmt.Errorf("another command is pending confirmation")
	}

	s.confirmCh = make(chan bool, 1)
	s.pendingCmd = cmdStr
	s.mu.Unlock()

	s.App.EmitEvent("clutch:require-confirmation", map[string]string{
		"appName": appName,
		"command": cmdStr,
	})

	confirmed := <-s.confirmCh

	s.mu.Lock()
	s.confirmCh = nil
	s.mu.Unlock()

	if !confirmed {
		return "", fmt.Errorf("command %q cancelled by user", cmdStr)
	}

	cmd := exec.Command("sh", "-c", cmdStr)
	out, err := cmd.CombinedOutput()
	output := string(out)
	if err != nil {
		return output, fmt.Errorf("command %q failed: %w\noutput:\n%s",
			cmdStr, err, output)
	}
	return output, nil
}

func (s *ClutchServices) ConfirmShell(allow bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.confirmCh != nil {
		s.confirmCh <- allow
	}
}
