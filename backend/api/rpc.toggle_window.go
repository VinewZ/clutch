package api

import (
	"context"
	"net/http"

	"connectrpc.com/connect"
	rpcproto "github.com/vinewz/clutch/backend/rpc/gen"
	"github.com/vinewz/clutch/backend/rpc/gen/rpcprotoconnect"
)

type ToggleWindowService struct {
	rpcprotoconnect.UnimplementedToggleWindowServiceHandler
	toggleFn func()
}

func NewToggleWindowService(toggleFn func()) *ToggleWindowService {
	return &ToggleWindowService{toggleFn: toggleFn}
}

func (t *ToggleWindowService) RegisterRoutes(mux *http.ServeMux) {
	path, handler := rpcprotoconnect.NewToggleWindowServiceHandler(t)
	mux.Handle(path, handler)
}

func (t *ToggleWindowService) ToggleWindow(
	ctx context.Context,
	req *connect.Request[rpcproto.ToggleWindowRequest],
) (*connect.Response[rpcproto.ToggleWindowResponse], error) {
	t.toggleFn()
	return connect.NewResponse(&rpcproto.ToggleWindowResponse{}), nil
}
