package app

import (
	"bufio"
	"errors"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type ClutchServices struct {
	protoServerPort int
	usrHomeDir      string
}

type DesktopApp struct {
	Id          int
	Name        string
	GenericName string
	Comment     string
	Icon        string
	Exec        string
	Terminal    string
	Keywords    []string
}

func registerServices(m *model) []application.Service {
	appServices := ClutchServices{
		usrHomeDir: m.UserHomeDir,
	}
	return []application.Service{
		application.NewService(&appServices, application.DefaultServiceOptions),
	}
}

func (s *ClutchServices) GetProtoServerPort() int {
	return s.protoServerPort
}

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

func (s *ClutchServices) ExecApp(app DesktopApp) error {
	execCmd := app.Exec
	var cmd *exec.Cmd
	term := getPreferredTerminal()

	switch runtime.GOOS {
	case "linux":
		if app.Terminal == "true" {
			cmd = exec.Command(term, "-e", cleanCmd(execCmd))
		} else {
			cmd = exec.Command(cleanCmd(execCmd))
		}
	default:
		return fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	// Start the command
	err := cmd.Start()
	if err != nil {
		log.Printf("Error starting command: %v", err)
		return err
	}

	return nil
}

// cleanCmd removes unwanted arguments such as %U, %F, etc.
func cleanCmd(s string) string {
	split := strings.Split(s, " ")
	cmd := split[0]

	// Optional: Remove additional arguments (e.g., %U, %F, etc.) if present
	// Could use regex to remove common unwanted arguments
	return cmd
}

// getPreferredTerminal returns the preferred terminal or falls back to a list of common terminals
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
