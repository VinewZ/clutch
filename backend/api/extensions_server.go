package api

import (
	"fmt"
	"net/http"
)

type server struct {
	mux  *http.ServeMux
	port int
}

func NewExtensionsServer(port int) *server {
	return &server{
		mux: http.NewServeMux(),
		port: port,
	}
}

func (s *server) RegisterExtensionsHandler(extensionsDirPath string) {
	extensionsHandler := http.StripPrefix("/extensions/", http.FileServer(http.Dir(extensionsDirPath)))
	s.mux.Handle("/extensions/", extensionsHandler)
}

func (s *server) ListenAndServe() error {
	fmt.Printf("Listening on port: :%d", s.port)
	err := http.ListenAndServe(fmt.Sprintf(":%d", s.port), s.mux)
	if err != nil {
		return err
	}
	return nil
}
