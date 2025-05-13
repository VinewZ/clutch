package api

import (
	"fmt"
	"net/http"

	connectcors "connectrpc.com/cors"
	"github.com/rs/cors"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
)

type protoServer struct {
	corsMux http.Handler
	port    int
}

func NewProtoServer(port int) *protoServer {
	mux := http.NewServeMux()
	corsMux := withCORS(mux)
	return &protoServer{
		corsMux: corsMux,
		port:    port,
	}
}

func (p *protoServer) ListenAndServe() error {
	finalHandler := h2c.NewHandler(p.corsMux, &http2.Server{})
	fmt.Printf("Started on :%d with CORS enabled", p.port)
	err := http.ListenAndServe(fmt.Sprintf("127.0.0.1:%d",p.port), finalHandler)
	if err != nil {
	  return err
	}

	return nil
}

func withCORS(h http.Handler) http.Handler {
	return cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: connectcors.AllowedMethods(),
		AllowedHeaders: connectcors.AllowedHeaders(),
		ExposedHeaders: connectcors.ExposedHeaders(),
	}).Handler(h)
}
