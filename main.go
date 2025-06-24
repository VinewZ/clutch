package main

import (
	"context"
	"embed"
	"fmt"
	"log"
	"net"
	"time"

	"github.com/vinewz/clutch/app"
	clutchRPCClient "github.com/vinewz/clutchRPC/go/pkg/client"
	clutchRPCServer "github.com/vinewz/clutchRPC/go/pkg/server"

	"github.com/vinewz/clutch/setup"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	env := setup.Env()
	// if called with --toggle flag, toggle running application
	// if failed, launch new application
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

	// set wails go/js bindings
	services := app.NewClutchService(m)
	m.Services = services.RegisterServices()

	m.Setup(assets)

	// set rpc server
	svc := clutchRPCServer.New(m.App, services.ToggleApp)
	go svc.ListenAndServe(fmt.Sprintf(":%d", m.ServersPorts.RPCServerPort))

	if err := m.App.Run(); err != nil {
		log.Fatal(err)
	}
}

// TODO: Update RPC to use the new API and toggle the app
// "github.com/vinewz/clutchRPC/go/pkg/server"
func tryToggle(ctx context.Context) bool {
	for _, port := range setup.PossiblePorts {
		addr := fmt.Sprintf("127.0.0.1:%d", port)
		// quick TCP check before doing a full RPC
		conn, err := net.DialTimeout("tcp", addr, 100*time.Millisecond)
		if err != nil {
			continue
		}
		conn.Close()

		cl, err := clutchRPCClient.New(ctx, port, 500)
		if err != nil {
			log.Fatalf("Failed to create clutchRPC client: %v", err)
		}

		cl.ToggleWindow(ctx, false)

	}
	return false
}
