package app

import (
	e "embed"
	"github.com/wailsapp/wails/v3/pkg/application"
)

type Model struct {
	App          *application.App
	IsAppVisible bool
}

func (a *Model) New(assets e.FS) *application.App {
	a.App = application.New(application.Options{
		Name:        "Moda",
		Description: "An open source, cross-platform, extensible app launcher.",
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
	})

	a.IsAppVisible = true

	a.App.NewWebviewWindowWithOptions(application.WebviewWindowOptions{
		Title:         "Moda",
		Width:         800,
		Height:        600,
		DisableResize: true,
		URL:           "/",
	})
	return a.App
}
