package desktopapps

import (
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"
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

func (da *DesktopApps) GetAll() []App {
	da.ensureInitialized()

	start := time.Now()

	var apps []App

	for _, dir := range da.desktopFileDirs {
		filepath.WalkDir(dir, func(p string, d fs.DirEntry, err error) error {
			if err != nil {
				return fs.SkipDir
			}

			if !d.IsDir() && strings.HasSuffix(p, ".desktop") {
				app, err := da.parseDesktopFile(p)
				if err == nil && app.Name != "" {
					apps = append(apps, app)
				}
			}
			return nil
		})
	}

	da.apps = apps

	log.Printf("Desktop apps scan completed in %v - found %d apps", time.Since(start), len(apps))

	return apps
}

func (da *DesktopApps) resolveIcon(icon string) string {
	return da.iconIndex.Resolve(icon, iconTargetSize)
}

func (da *DesktopApps) IconIndex() *IconIndex {
	da.ensureInitialized()
	return da.iconIndex
}
