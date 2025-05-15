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

	protoServerPort, err := utils.FindAvailablePort()
	if err != nil {
		log.Fatalf("Failed to find a port to host the proto server: %s", err.Error())
	}
	go startProtoServer(protoServerPort)

	m := app.NewModel(protoServerPort)
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

func startProtoServer(protoServerPort int) {
	protoServer := api.NewProtoServer(protoServerPort)
	err := protoServer.ListenAndServe()
	if err != nil {
		log.Fatalf("Couldn't start proto server: %s", err.Error())
	}
}
