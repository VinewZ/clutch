package app

import (
	"bufio"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func (s *ClutchServices) GetDesktopApps() map[string]DesktopApp {
	desktopFileLocations := []string{
		"/usr/share/applications",
		"/usr/local/share/applications",
		"/var/lib/snapd/desktop/applications",
		"/var/lib/flatpak/exports/share/applications",
		filepath.Join(s.usrHomeDir, ".local/share/applications"),
		filepath.Join(s.usrHomeDir, ".local/share/flatpak/exports/share/applications"),
		filepath.Join(s.usrHomeDir, ".gnome/apps"),
		filepath.Join(s.usrHomeDir, ".kde/share/applnk"),
	}
	desktopFiles := map[string]DesktopApp{}
	idCounter := 0
	for _, location := range desktopFileLocations {
		files, err := os.ReadDir(location)
		if err != nil {
			fmt.Printf("Error reading directory %s: %v\n", location, err)
			continue
		}
		for _, file := range files {
			if strings.HasSuffix(file.Name(), ".desktop") {
				desktopFilePath := filepath.Join(location, file.Name())
				app, err := parseDesktopFile(desktopFilePath)
				if err != nil {
					fmt.Printf("Error parsing desktop file %s: %v\n", desktopFilePath, err)
					continue
				}
				app.Id = idCounter
				idCounter++
				desktopFiles[app.Name] = app
			}
		}
	}

	return desktopFiles
}

func parseDesktopFile(fPath string) (DesktopApp, error) {
	file, err := os.Open(fPath)
	if err != nil {
		return DesktopApp{}, err
	}
	defer file.Close()

	var mainSection strings.Builder
	scanner := bufio.NewScanner(file)
	inMainSection := false

	for scanner.Scan() {
		line := scanner.Text()
		if line == "[Desktop Entry]" {
			inMainSection = true
		} else if inMainSection && strings.HasPrefix(line, "[") {
			// Stop processing when a new section starts
			break
		} else if inMainSection {
			mainSection.WriteString(line + "\n")
		}
	}

	if err := scanner.Err(); err != nil {
		return DesktopApp{}, err
	}

	if mainSection.Len() == 0 {
		return DesktopApp{}, errors.New("no valid [Desktop Entry] section found")
	}

	return parseMainSection(mainSection.String())
}

func parseMainSection(section string) (DesktopApp, error) {
	scanner := bufio.NewScanner(strings.NewReader(section))
	app := DesktopApp{}

	for scanner.Scan() {
		line := scanner.Text()
		split := strings.SplitN(line, "=", 2) // Ensure only one split
		if len(split) != 2 {
			continue // Skip malformed lines
		}

		key, value := split[0], split[1]
		switch key {
		case "Name":
			app.Name = value
		case "GenericName":
			app.GenericName = value
		case "Comment":
			app.Comment = value
		case "Exec":
			app.Exec = value
		case "Icon":
			app.Icon = value
		case "Terminal":
			app.Terminal = value
    case "Keywords":
      app.Keywords = strings.Split(value, ";")
		}
	}

	if err := scanner.Err(); err != nil {
		return DesktopApp{}, err
	}

	return app, nil
}
