package api

import (
	"fmt"
	"net/http"
)

type server struct {
	mux  *http.ServeMux
	port int
}

func NewServer() *server {
	return &server{}
}

func (s *server) NewMux() *http.ServeMux {
	s.mux = http.NewServeMux()
	return s.mux
}

func (s *server) RegisterExtensionHandler(extensionsDirPath string) {
	extensionsHandler := http.StripPrefix("/extensions/", http.FileServer(http.Dir(extensionsDirPath)))
	s.mux.Handle("/extensions", extensionsHandler)
}

func (s *server) ListenAndServe() {
	fmt.Printf("Listening on port: :%d", s.port)
	if err := http.ListenAndServe(fmt.Sprintf(":%d", s.port), s.mux); err != nil {
		panic(fmt.Sprintf("Failed to start server: %v", err))
	}
}
