package main

import (
	"embed"
	"flag"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/charmbracelet/log"
	"github.com/vinewz/clutch/internal/apps"
	"github.com/vinewz/clutch/internal/socket"
	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:dist
var assets embed.FS

func init() {
	application.RegisterEvent[string]("time")
}

func main() {
	serverFlag := flag.Bool("server", false, "Start in server mode (hidden, listen for toggle)")
	toggleFlag := flag.Bool("toggle", false, "Send toggle command to running server")
	flag.Parse()

	if *toggleFlag {
		client := socket.NewClient()
		if err := client.Send(socket.CmdToggle); err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
		return
	}

	da := &apps.DesktopApps{}
	ac := &apps.AppController{}

	app := application.New(application.Options{
		Name:        "clutch",
		Description: "A desktop app launcher",
		Services: []application.Service{
			application.NewService(da),
			application.NewService(ac),
		},
		Assets: application.AssetOptions{
			Handler:    application.AssetFileServerFS(assets),
			Middleware: middleware,
		},
	})

	win := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:         "",
		URL:           "/",
		Width:         775,
		Height:        475,
		AlwaysOnTop:   true,
		Frameless:     true,
		DisableResize: true,
	})

	ac.SetWindow(win)

	if *serverFlag {
		da.EnsureInitialized()
		da.GetAll()

		srv := socket.NewServer(func(cmd socket.Command) error {
			switch cmd {
			case socket.CmdToggle:
				ac.Toggle()
			case socket.CmdShow:
				ac.Show()
			case socket.CmdHide:
				ac.Hide()
			}
			return nil
		})

		if err := srv.Start(); err != nil {
			log.Error("Failed to start socket server", "error", err)
		} else {
			ac.Hide()
		}

		defer srv.Stop()
	}

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
