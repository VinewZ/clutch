package app

import (
	e "embed"

	"github.com/vinewz/clutch/backend/api"
	"github.com/vinewz/clutch/setup"
	"github.com/wailsapp/wails/v3/pkg/application"
)

type model struct {
	App       *application.App
	IsVisible bool
}

func NewModel() *model {
	return &model{}
}

func (a *model) Init(assets e.FS, config *setup.Setup) *application.App {
	server := api.NewServer()
	server.NewMux()
	server.RegisterExtensionHandler(config.ExtensionsDir)

	a.App = application.New(application.Options{
		Name:        "Clutch",
		Description: "An open source, cross-platform, extensible app launcher.",
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
	})

	a.App.NewWebviewWindowWithOptions(application.WebviewWindowOptions{
		Title:         "Clutch",
		Width:         800,
		Height:        600,
		DisableResize: true,
		URL:           "/",
	})

	a.IsVisible = true

	return a.App
}
