package api

import (
	"context"
	"fmt"
	"net/http"

	connectCors "connectrpc.com/cors"
	"github.com/rs/cors"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
)

type Service interface {
	RegisterRoutes(mux *http.ServeMux)
}

type RPCServer struct {
	port    int
	mux     *http.ServeMux
	handler http.Handler
}

func NewRPCServer(port int, allowedOrigins []string) *RPCServer {
	mux := http.NewServeMux()
	corsHandler := cors.New(cors.Options{
		AllowedOrigins: allowedOrigins,
		AllowedMethods: connectCors.AllowedMethods(),
		AllowedHeaders: connectCors.AllowedHeaders(),
		ExposedHeaders: connectCors.ExposedHeaders(),
	}).Handler(mux)

	h2cHandler := h2c.NewHandler(corsHandler, &http2.Server{})

	return &RPCServer{
		port:    port,
		mux:     mux,
		handler: h2cHandler,
	}
}

func (s *RPCServer) RegisterService(svcs ...Service) {
	for _, svc := range svcs {
		svc.RegisterRoutes(s.mux)
	}
}

func (s *RPCServer) ListenAndServe(ctx context.Context) error {
	addr := fmt.Sprintf("127.0.0.1:%d", s.port)
	server := &http.Server{
		Addr:    addr,
		Handler: s.handler,
	}

	fmt.Printf("Server starting on %s with CORS and h2c support\n", addr)

	return server.ListenAndServe()
}
