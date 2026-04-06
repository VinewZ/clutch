package main

import (
	"embed"
	"github.com/charmbracelet/log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/vinewz/clutch/services/desktopApps"
	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS

func init() {
	// Register a custom event whose associated data type is string.
	// This is not required, but the binding generator will pick up registered events
	// and provide a strongly typed JS/TS API for them.
	application.RegisterEvent[string]("time")
}

func main() {
	app := application.New(application.Options{
		Name:        "clutch-v2",
		Description: "A demo of using raw HTML & CSS",
		Services: []application.Service{
			application.NewService(&desktopapps.DesktopApps{}),
		},
		Assets: application.AssetOptions{
			Handler:    application.AssetFileServerFS(assets),
			Middleware: middleware,
		},
	})

	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:         "",
		URL:           "/",
		Width:         775,
		Height:        475,
		AlwaysOnTop:   true,
		Frameless:     true,
		DisableResize: true,
	})

	err := app.Run()

	if err != nil {
		log.Error("Application failed to run", "error", err)
	}
}
func middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/files/") {
			serveFile(w, r)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func serveFile(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Query().Get("path")
	if path == "" {
		http.Error(w, "missing path parameter", http.StatusBadRequest)
		return
	}

	data, err := os.ReadFile(path)
	if err != nil {
		http.Error(w, "file not found", http.StatusNotFound)
		return
	}

	ext := strings.ToLower(filepath.Ext(path))
	contentType := map[string]string{
		".svg":  "image/svg+xml",
		".png":  "image/png",
		".jpg":  "image/jpeg",
		".jpeg": "image/jpeg",
		".gif":  "image/gif",
	}[ext]

	if contentType == "" {
		contentType = "application/octet-stream"
	}

	w.Header().Set("Content-Type", contentType)
	w.Write(data)
}
