package actions

import (
	"fmt"
	"os"
	"os/exec"

	"github.com/charmbracelet/log"
)

func handleOpenInBrowser(props map[string]interface{}) ActionResult {
	url, _ := props["url"].(string)
	if url == "" {
		return ActionResult{
			Error: fmt.Errorf("no URL provided"),
		}
	}

	cmd := exec.Command("xdg-open", url)
	if err := cmd.Start(); err != nil {
		log.Error("xdg-open failed", "url", url, "error", err)
		return ActionResult{
			Error: fmt.Errorf("failed to open URL: %w", err),
		}
	}

	return ActionResult{
		Title:   "Opened in Browser",
		Message: url,
	}
}

func handleOpen(props map[string]interface{}) ActionResult {
	target, _ := props["target"].(string)
	if target == "" {
		return ActionResult{
			Error: fmt.Errorf("no target provided"),
		}
	}

	app, _ := props["application"].(string)

	var cmd *exec.Cmd
	if app != "" {
		cmd = exec.Command(app, target)
	} else {
		cmd = exec.Command("xdg-open", target)
	}

	if err := cmd.Start(); err != nil {
		log.Error("open failed", "target", target, "app", app, "error", err)
		return ActionResult{
			Error: fmt.Errorf("failed to open: %w", err),
		}
	}

	return ActionResult{
		Title:   "Opened",
		Message: target,
	}
}

func handleOpenWith(props map[string]interface{}) ActionResult {
	target, _ := props["target"].(string)
	if target == "" {
		return ActionResult{
			Error: fmt.Errorf("no target provided"),
		}
	}

	app, _ := props["application"].(string)

	var cmd *exec.Cmd
	if app != "" {
		cmd = exec.Command(app, target)
	} else {
		cmd = exec.Command("xdg-open", target)
	}

	if err := cmd.Start(); err != nil {
		log.Error("open-with failed", "target", target, "app", app, "error", err)
		return ActionResult{
			Error: fmt.Errorf("failed to open with: %w", err),
		}
	}

	return ActionResult{
		Title:   "Opened With",
		Message: target,
	}
}

func handlePaste(props map[string]interface{}) ActionResult {
	cmd := exec.Command("wl-paste", "--primary", "--no-newline")
	output, err := cmd.Output()
	if err != nil {
		log.Error("wl-paste failed", "error", err)
		return ActionResult{
			Error: fmt.Errorf("failed to paste from clipboard: %w", err),
		}
	}

	return ActionResult{
		Title:   "Pasted",
		Message: truncate(string(output), 100),
	}
}

func handleShowInFinder(props map[string]interface{}) ActionResult {
	target, _ := props["target"].(string)
	if target == "" {
		return ActionResult{
			Error: fmt.Errorf("no target provided"),
		}
	}

	info, err := os.Stat(target)
	if err != nil {
		return ActionResult{
			Error: fmt.Errorf("path not found: %w", err),
		}
	}

	dir := target
	if !info.IsDir() {
		dir = ""
	}

	var cmd *exec.Cmd
	if dir != "" {
		cmd = exec.Command("xdg-open", dir)
	} else {
		cmd = exec.Command("xdg-open", target)
	}

	if err := cmd.Start(); err != nil {
		log.Error("show-in-finder failed", "target", target, "error", err)
		return ActionResult{
			Error: fmt.Errorf("failed to show in file manager: %w", err),
		}
	}

	return ActionResult{
		Title:   "Shown in File Manager",
		Message: target,
	}
}

func handleTrash(props map[string]interface{}) ActionResult {
	target, _ := props["target"].(string)
	if target == "" {
		return ActionResult{
			Error: fmt.Errorf("no target provided"),
		}
	}

	cmd := exec.Command("gio", "trash", target)
	if output, err := cmd.CombinedOutput(); err != nil {
		log.Error("gio trash failed", "target", target, "error", err, "output", string(output))
		return ActionResult{
			Error: fmt.Errorf("failed to move to trash: %w", err),
		}
	}

	return ActionResult{
		Title:   "Moved to Trash",
		Message: target,
	}
}
