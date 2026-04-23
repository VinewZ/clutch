package actions

import (
	"fmt"
	"os/exec"

	"github.com/charmbracelet/log"
)

func handleCopyToClipboard(props map[string]interface{}) ActionResult {
	content, _ := props["content"].(string)
	if content == "" {
		if title, ok := props["title"].(string); ok {
			content = title
		}
	}
	if content == "" {
		return ActionResult{
			Error: fmt.Errorf("no content to copy"),
		}
	}

	cmd := exec.Command("wl-copy", content)
	if output, err := cmd.CombinedOutput(); err != nil {
		log.Error("wl-copy failed", "error", err, "output", string(output))
		return ActionResult{
			Error: fmt.Errorf("failed to copy to clipboard: %w", err),
		}
	}

	return ActionResult{
		Title:   "Copied to Clipboard",
		Message: truncate(content, 100),
	}
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
