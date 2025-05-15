package api

import (
	e "embed"
	"mime"
	"net/http"
	"os"
	"path"
	"path/filepath"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type server struct {
	Mux *http.ServeMux
}

func NewAssetsServer() *server {
	return &server{
		Mux: http.NewServeMux(),
	}
}

func (s *server) RegisterWailsAssetHandler(assets e.FS) {
	s.Mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		assetsHandler := application.AssetFileServerFS(assets)
		assetsHandler.ServeHTTP(w, r)
	})
}

func (s *server) RegisterExtensionsHandler(extensionsDir string) {
	s.Mux.Handle("/extensions/", http.StripPrefix("/extensions/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cleanPath := path.Clean(r.URL.Path)
		fullPath := filepath.Join(extensionsDir, cleanPath)

		info, err := os.Stat(fullPath)
		if err != nil || info.IsDir() {
			http.NotFound(w, r)
			return
		}

		file, err := os.ReadFile(fullPath)
		if err != nil {
			http.Error(w, "File not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")
		w.Header().Set(
			"Content-Disposition",
			"inline; filename=\""+filepath.Base(fullPath)+"\"",
		)
		ext := filepath.Ext(fullPath)
		if mimeType := mime.TypeByExtension(ext); mimeType != "" {
			w.Header().Set("Content-Type", mimeType)
		} else {
			http.ServeFile(w, r, fullPath)
			return
		}
		w.Write(file)
	})))
}
