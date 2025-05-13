package api

import (
	"fmt"
	"net/http"
)

type devServer struct {
	mux  *http.ServeMux
	port int
}

func NewDevExtensionsServer(port int) *devServer {
	return &devServer{
		mux: http.NewServeMux(),
		port: port,
	}
}

func (s *devServer) RegisterDevExtensionsHandler(dir string) {
	devExtensionsHandler := http.StripPrefix(fmt.Sprintf("/%s/", dir), http.FileServer(http.Dir(dir)))
	s.mux.Handle("/extensions/dev/", devExtensionsHandler)
}

func (s *devServer) ListenAndServe() error {
	fmt.Printf("Listening on port: :%d", s.port)
	err := http.ListenAndServe(fmt.Sprintf(":%d", s.port), s.mux)
	if err != nil {
		return err
	}
	return nil
}
