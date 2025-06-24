package api

import (
	"context"
	"net/http"

	"connectrpc.com/connect"
	rpcproto "github.com/vinewz/clutch/backend/rpc/gen"
	"github.com/vinewz/clutch/backend/rpc/gen/rpcprotoconnect"
)

type UseShellService struct {
	rpcprotoconnect.UnimplementedUseShellServiceHandler
	useShell func(appName, cmdStr string) (string, error)
}

func NewUseShellService(useShell func(appName, cmdStr string) (string, error)) *UseShellService {
	return &UseShellService{useShell: useShell}
}

func (s *UseShellService) RegisterRoutes(mux *http.ServeMux) {
	path, handler := rpcprotoconnect.NewUseShellServiceHandler(s)
	mux.Handle(path, handler)
}

func (s *UseShellService) UseShell(
	ctx context.Context,
	req *connect.Request[rpcproto.UseShellRequest],
) (*connect.Response[rpcproto.UseShellResponse], error) {
	s.useShell(req.Msg.AppName, req.Msg.Command)
	return connect.NewResponse(&rpcproto.UseShellResponse{}), nil
}
