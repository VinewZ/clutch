package app

import (
	e "embed"
	"log/slog"

	"github.com/vinewz/clutch/backend/api"
	"github.com/vinewz/clutch/setup"
	"github.com/wailsapp/wails/v3/pkg/application"
)

type Model struct {
	App       *application.App
	IsVisible bool
	Services  []application.Service
	setup.Directories
	setup.ServersPorts
}

func NewModel(dirs *setup.Directories, ports *setup.ServersPorts) *Model {
	return &Model{
		IsVisible:    true,
		Directories:  *dirs,
		ServersPorts: *ports,
	}
}

func (m *Model) Setup(assets e.FS) *application.App {
	assetsServer := api.NewAssetsServer()
	assetsServer.RegisterWailsAssetHandler(assets)
	assetsServer.RegisterExtensionsHandler(m.Directories.ExtensionsDir)

	m.App = application.New(application.Options{
		Name:        "Clutch",
		Description: "An open source, cross-platform, extensible app launcher.",
		Assets: application.AssetOptions{
			Handler:        assetsServer.Mux,
			DisableLogging: true,
		},
		Services: m.Services,
		LogLevel: slog.LevelError,
	})

	m.App.NewWebviewWindowWithOptions(application.WebviewWindowOptions{
		Title:         "Clutch",
		Width:         800,
		Height:        600,
		DisableResize: true,
		URL:           "/",
		AlwaysOnTop:   true,
	})

	return m.App
}
