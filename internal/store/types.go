package store

import "time"

type Extension struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	Title         string    `json:"title"`
	Description   string    `json:"description"`
	Author        Author    `json:"author"`
	DownloadCount int       `json:"download_count"`
	Categories    []string  `json:"categories"`
	Icons         Icons     `json:"icons"`
	Commands      []Command `json:"commands"`
	DownloadURL   string    `json:"download_url"`
	StoreURL      string    `json:"store_url"`
	SourceURL     string    `json:"source_url"`
	Installed     bool      `json:"installed"`
}

type Author struct {
	Name   string `json:"name"`
	Handle string `json:"handle"`
	Avatar string `json:"avatar"`
}

type Icons struct {
	Light string `json:"light"`
	Dark  string `json:"dark"`
}

type Command struct {
	Name        string `json:"name"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Mode        string `json:"mode"`
}

type Registry struct {
	Version    int                     `json:"version"`
	Extensions map[string]InstalledExt `json:"extensions"`
}

type InstalledExt struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Title       string    `json:"title"`
	Author      string    `json:"author"`
	InstalledAt time.Time `json:"installed_at"`
	Path        string    `json:"path"`
	Commands    []Command `json:"commands"`
	Icons       Icons     `json:"icons"`
}

type apiResponse struct {
	Data []apiExtension `json:"data"`
}

type apiExtension struct {
	ID            string       `json:"id"`
	Name          string       `json:"name"`
	Title         string       `json:"title"`
	Description   string       `json:"description"`
	Author        apiAuthor    `json:"author"`
	DownloadCount int          `json:"download_count"`
	Categories    []string     `json:"categories"`
	Icons         apiIcons     `json:"icons"`
	Commands      []apiCommand `json:"commands"`
	DownloadURL   string       `json:"download_url"`
	StoreURL      string       `json:"store_url"`
	SourceURL     string       `json:"source_url"`
}

type apiAuthor struct {
	Name   string `json:"name"`
	Handle string `json:"handle"`
	Avatar string `json:"avatar"`
}

type apiIcons struct {
	Light string `json:"light"`
	Dark  string `json:"dark"`
}

type apiCommand struct {
	Name        string `json:"name"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Mode        string `json:"mode"`
}

func (a apiExtension) toExtension() Extension {
	commands := make([]Command, len(a.Commands))
	for i, c := range a.Commands {
		commands[i] = Command{
			Name:        c.Name,
			Title:       c.Title,
			Description: c.Description,
			Mode:        c.Mode,
		}
	}

	return Extension{
		ID:            a.ID,
		Name:          a.Name,
		Title:         a.Title,
		Description:   a.Description,
		Author:        Author{Name: a.Author.Name, Handle: a.Author.Handle, Avatar: a.Author.Avatar},
		DownloadCount: a.DownloadCount,
		Categories:    a.Categories,
		Icons:         Icons{Light: a.Icons.Light, Dark: a.Icons.Dark},
		Commands:      commands,
		DownloadURL:   a.DownloadURL,
		StoreURL:      a.StoreURL,
		SourceURL:     a.SourceURL,
	}
}
