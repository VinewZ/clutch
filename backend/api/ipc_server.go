package api

import (
	"context"
	"fmt"
	"net/http"

	"connectrpc.com/connect"
	connectCors "connectrpc.com/cors"
	"github.com/rs/cors"
	ipcproto "github.com/vinewz/clutch/backend/ipc/gen"
	"github.com/vinewz/clutch/backend/ipc/gen/ipcprotoconnect"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
)

type Service interface {
	RegisterRoutes(mux *http.ServeMux)
}

type IPCServer struct {
	port    int
	mux     *http.ServeMux
	handler http.Handler
}

func NewIPCServer(port int, allowedOrigins []string) *IPCServer {
	mux := http.NewServeMux()
	corsHandler := cors.New(cors.Options{
		AllowedOrigins: allowedOrigins,
		AllowedMethods: connectCors.AllowedMethods(),
		AllowedHeaders: connectCors.AllowedHeaders(),
		ExposedHeaders: connectCors.ExposedHeaders(),
	}).Handler(mux)

	h2cHandler := h2c.NewHandler(corsHandler, &http2.Server{})

	return &IPCServer{
		port:    port,
		mux:     mux,
		handler: h2cHandler,
	}
}

func (s *IPCServer) RegisterService(svc Service) {
	svc.RegisterRoutes(s.mux)
}

func (s *IPCServer) ListenAndServe(ctx context.Context) error {
	addr := fmt.Sprintf("127.0.0.1:%d", s.port)
	server := &http.Server{
		Addr:    addr,
		Handler: s.handler,
	}

	fmt.Printf("Server starting on %s with CORS and h2c support\n", addr)

	return server.ListenAndServe()
}

type ToggleWindowService struct {
	ipcprotoconnect.UnimplementedToggleWindowServiceHandler
	toggleFn func()
}

func NewToggleWindowService(toggleFn func()) *ToggleWindowService {
	return &ToggleWindowService{toggleFn: toggleFn}
}

func (t *ToggleWindowService) RegisterRoutes(mux *http.ServeMux) {
	path, handler := ipcprotoconnect.NewToggleWindowServiceHandler(t)
	mux.Handle(path, handler)
}

func (t *ToggleWindowService) ToggleWindow(
	ctx context.Context,
	req *connect.Request[ipcproto.ToggleWindowRequest],
) (*connect.Response[ipcproto.ToggleWindowResponse], error) {
	t.toggleFn()
	return connect.NewResponse(&ipcproto.ToggleWindowResponse{}), nil
}
