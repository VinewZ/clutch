package main

import (
	"context"
	"embed"
	"log"

	"github.com/vinewz/clutch/app"
	"github.com/vinewz/clutch/backend/api"
	"github.com/vinewz/clutch/setup"
	"github.com/vinewz/clutch/utils"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	set, err := setup.NewSetup()
	if err != nil {
		log.Fatalf("Failed to setup config: %v", err)
	}

	extensionServerPort, err := utils.FindAvailablePort()
	if err != nil {
		log.Fatalf("Failed to find a port to host the extension server: %s", err.Error())
	}
	go startExtensionsServer(extensionServerPort, set.ExtensionsDir)

	protoServerPort, err := utils.FindAvailablePort()
	if err != nil {
		log.Fatalf("Failed to find a port to host the proto server: %s", err.Error())
	}
	go startProtoServer(protoServerPort)

	m := app.NewModel(extensionServerPort, protoServerPort)
	m.Setup(assets, set)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	m.SetupKeybindings(ctx)

	m.App.OnShutdown(func() {
		cancel()
	})

	if err := m.App.Run(); err != nil {
		log.Fatal(err)
	}
}

func startExtensionsServer(extensionServerPort int, extensionsDir string) {
	extServer := api.NewExtensionsServer(extensionServerPort)
	extServer.RegisterExtensionsHandler(extensionsDir)
	err := extServer.ListenAndServe()
	if err != nil {
		log.Fatalf("Couldn't start extensions server: %s", err.Error())
	}
}

func startProtoServer(protoServerPort int) {
	protoServer := api.NewProtoServer(protoServerPort)
	err := protoServer.ListenAndServe()
	if err != nil {
		log.Fatalf("Couldn't start proto server: %s", err.Error())
	}
}
