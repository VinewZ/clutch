package main

import (
	"context"
	"embed"
	"fmt"
	"log"
	"net"
	"net/http"
	"time"

	"connectrpc.com/connect"
	"github.com/vinewz/clutch/app"
	ipcproto "github.com/vinewz/clutch/backend/ipc/gen"
	"github.com/vinewz/clutch/backend/ipc/gen/ipcprotoconnect"
	"github.com/vinewz/clutch/setup"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	env := setup.Env()
	if env.Toggle {
		if tryToggle(context.Background()) {
			return
		}
	}

	dirs, err := setup.Dirs()
	if err != nil {
		log.Fatalf("Failed to setup directories: %s", err.Error())
	}

	ports, err := setup.Ports()
	if err != nil {
		log.Fatalf("Failed to setup ports: %s", err.Error())
	}

	m := app.NewModel(dirs, ports)
	m.BeforeStart()
	m.Setup(assets)

	if err := m.App.Run(); err != nil {
		log.Fatal(err)
	}
}

func tryToggle(ctx context.Context) bool {
	for _, port := range setup.PossiblePorts {
		addr := fmt.Sprintf("127.0.0.1:%d", port)
		// quick TCP check before doing a full RPC
		conn, err := net.DialTimeout("tcp", addr, 100*time.Millisecond)
		if err != nil {
			continue
		}
		conn.Close()

		client := ipcprotoconnect.NewToggleWindowServiceClient(http.DefaultClient, "http://"+addr)
		toCtx, cancel := context.WithTimeout(ctx, 200*time.Millisecond)
		defer cancel()

		if _, err := client.ToggleWindow(toCtx,
			connect.NewRequest(&ipcproto.ToggleWindowRequest{}),
		); err == nil {
			log.Printf("Toggled existing server on %d", port)
			return true
		}
		log.Printf("Found listener on %d but toggle failed: %v", port, err)
	}
	return false
}
