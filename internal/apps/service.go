package apps

import (
	"fmt"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/charmbracelet/log"
)

type DesktopApps struct {
	desktopFileDirs []string
	iconIndex       *IconIndex
	apps            []App
}

func (da *DesktopApps) ensureInitialized() {
	if da.desktopFileDirs != nil {
		return
	}

	home, err := os.UserHomeDir()
	if err != nil {
		home = ""
	}

	da.desktopFileDirs = []string{
		"/usr/share/applications",
		"/usr/local/share/applications",
		"/var/lib/flatpak/exports/share/applications",
		"/var/lib/snapd/desktop/applications",
		filepath.Join(home, ".local/share/applications"),
		filepath.Join(home, ".local/share/flatpak/exports/share/applications"),
	}

	da.iconIndex = NewIconIndex()
	da.iconIndex.LoadThemes()
}

func (da *DesktopApps) EnsureInitialized() {
	da.ensureInitialized()
}

func (da *DesktopApps) GetAll() []App {
	da.ensureInitialized()

	start := time.Now()

	var appList []App

	for _, dir := range da.desktopFileDirs {
		filepath.WalkDir(dir, func(p string, d fs.DirEntry, err error) error {
			if err != nil {
				return fs.SkipDir
			}

			if !d.IsDir() && strings.HasSuffix(p, ".desktop") {
				app, err := da.parseDesktopFile(p)
				if err == nil && app.Name != "" {
					appList = append(appList, app)
				}
			}
			return nil
		})
	}

	da.apps = appList

	log.Info("Desktop apps scan completed", "duration", time.Since(start), "count", len(appList))

	return appList
}

func (da *DesktopApps) resolveIcon(icon string) string {
	return da.iconIndex.Resolve(icon, iconTargetSize)
}

func (da *DesktopApps) IconIndex() *IconIndex {
	da.ensureInitialized()
	return da.iconIndex
}

func (da *DesktopApps) Launch(app App) error {
	var cmd *exec.Cmd

	if app.Terminal {
		term := getPreferredTerminal()
		cmd = exec.Command(term, "-e", cleanCmd(app.Exec))
	} else {
		parts := strings.Fields(app.ExecRaw)
		if len(parts) == 0 {
			log.Error("Empty exec command", "app", app.Name)
			return fmt.Errorf("empty exec command")
		}
		cmd = exec.Command(parts[0], parts[1:]...)
	}

	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

	err := cmd.Start()
	if err != nil {
		log.Error("Failed to launch app", "name", app.Name, "error", err)
		return err
	}

	log.Info("App launched", "name", app.Name, "terminal", app.Terminal)
	return nil
}

func cleanCmd(s string) string {
	split := strings.Split(s, " ")
	return split[0]
}

func getPreferredTerminal() string {
	if terminal := os.Getenv("TERMINAL"); terminal != "" {
		return terminal
	}
	terminals := []string{
		"x-terminal-emulator",
		"gnome-terminal",
		"konsole",
		"xfce4-terminal",
		"wezterm",
		"ghostty",
		"kitty",
		"alacritty",
		"lxterminal",
		"st",
	}
	for _, term := range terminals {
		if _, err := exec.LookPath(term); err == nil {
			return term
		}
	}
	return ""
}
