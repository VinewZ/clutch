package api

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"connectrpc.com/connect"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"

	connectcors "connectrpc.com/cors"
	"github.com/rs/cors"

	extensionProto "github.com/vinewz/clutch-api/go/pkg"
	extensionProtoConnect "github.com/vinewz/clutch-api/go/pkg/extensionprotoconnect"
)

type extensionsServer struct {
	extensionProtoConnect.UnimplementedExtensionsServiceHandler
	baseDir string
}

func withCORS(h http.Handler) http.Handler {
	return cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: connectcors.AllowedMethods(),
		AllowedHeaders: connectcors.AllowedHeaders(),
		ExposedHeaders: connectcors.ExposedHeaders(),
	}).Handler(h)
}
func (s *extensionsServer) GetExtension(
	ctx context.Context,
	req *connect.Request[extensionProto.ExtensionsRequest],
	stream *connect.ServerStream[extensionProto.ExtensionsResponse],
) error {
	// Clean and validate path to prevent traversal attacks
	rel := filepath.Clean(req.Msg.ExtensionName)
	if strings.HasPrefix(rel, "..") {
		return connect.NewError(connect.CodeInvalidArgument, fmt.Errorf("invalid path"))
	}

	full := filepath.Join(s.baseDir, rel, "index.html")
	f, err := os.Open(full)
	if err != nil {
		return connect.NewError(connect.CodeNotFound, fmt.Errorf("file not found: %w", err))
	}
	defer f.Close()

	buf := make([]byte, 4096)
	for {
		n, err := f.Read(buf)
		if err == io.EOF {
			break
		}
		if err != nil {
			return connect.NewError(connect.CodeInternal, fmt.Errorf("read error: %w", err))
		}
		// send chunk
		if err := stream.Send(&extensionProto.ExtensionsResponse{
			Data: buf[:n],
		}); err != nil {
			return connect.NewError(connect.CodeUnavailable, fmt.Errorf("send error: %w", err))
		}
	}
	return nil
}

func NewProtoServer() {
	server := &extensionsServer{
		baseDir: filepath.Join(os.Getenv("HOME"), ".config", "clutch", "extensions"),
	}

	mux := http.NewServeMux()
	path, handler := extensionProtoConnect.NewExtensionsServiceHandler(server)
	mux.Handle(path, handler)

	corsMux := withCORS(mux)

	finalHandler := h2c.NewHandler(corsMux, &http2.Server{})

	log.Println("Started on :8080 with CORS enabled")
	http.ListenAndServe("localhost:8080", finalHandler)
}
