package apps

import (
	"bufio"
	"os"
	"strconv"
	"strings"
)

type App struct {
	Path        string   `json:"path"`
	Name        string   `json:"name"`
	GenericName string   `json:"genericName"`
	Comment     string   `json:"comment"`
	Icon        string   `json:"icon"`
	IconPath    string   `json:"iconPath"`
	Type        string   `json:"type"`
	Exec        string   `json:"exec"`
	ExecRaw     string   `json:"execRaw"`
	Terminal    bool     `json:"terminal"`
	Keywords    []string `json:"keywords"`
}

func (da *DesktopApps) parseDesktopFile(fPath string) (App, error) {
	file, err := os.Open(fPath)
	if err != nil {
		return App{}, err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	app := App{Path: fPath}

	inMainSection := false

	for scanner.Scan() {
		line := scanner.Text()

		if line == "[Desktop Entry]" {
			inMainSection = true
			continue
		}

		if inMainSection && strings.HasPrefix(line, "[") {
			break
		}

		if !inMainSection {
			continue
		}

		split := strings.SplitN(line, "=", 2)
		if len(split) != 2 {
			continue
		}

		key, value := split[0], split[1]

		if key == "NoDisplay" {
			v, _ := strconv.ParseBool(strings.TrimSpace(value))
			if v {
				return App{}, nil
			}
		}

		switch key {
		case "Name":
			app.Name = value
		case "GenericName":
			app.GenericName = value
		case "Comment":
			app.Comment = value
		case "Exec":
			app.Exec = value
			app.ExecRaw = cleanExec(value)
		case "Icon":
			app.Icon = value
			app.IconPath = da.resolveIcon(value)
		case "Type":
			app.Type = value
		case "Terminal":
			v, _ := strconv.ParseBool(value)
			app.Terminal = v
		case "Keywords":
			app.Keywords = parseKeywords(value)
		}
	}

	if err := scanner.Err(); err != nil {
		return App{}, err
	}

	return app, nil
}

func cleanExec(exec string) string {
	replacer := strings.NewReplacer(
		"%u", "", "%U", "",
		"%f", "", "%F", "",
		"%i", "", "%c", "", "%k", "",
	)

	return strings.TrimSpace(replacer.Replace(exec))
}

func parseKeywords(value string) []string {
	if value == "" {
		return nil
	}

	var keywords []string
	for k := range strings.SplitSeq(value, ";") {
		k = strings.TrimSpace(k)
		if k != "" {
			keywords = append(keywords, k)
		}
	}
	return keywords
}
