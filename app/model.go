package app

import (
	"context"
	e "embed"
	"log"
	"log/slog"

	keyboard "github.com/VinewZ/go-evdev-keyboard"
	"github.com/vinewz/clutch/backend/api"
	"github.com/vinewz/clutch/setup"
	"github.com/wailsapp/wails/v3/pkg/application"
)

type model struct {
	App             *application.App
	UserHomeDir     string
	UserConfigDir string
	IsVisible       bool
	ProtoServerPort int
}

func NewModel(protoServerPort int) *model {
	return &model{
		IsVisible:       true,
		ProtoServerPort: protoServerPort,
	}
}

func (m *model) Setup(assets e.FS, config *setup.Setup) *application.App {
	m.UserHomeDir = config.UserHomeDIr

	services := registerServices(m)

	assetsServer := api.NewAssetsServer()
	assetsServer.RegisterWailsAssetHandler(assets)
	assetsServer.RegisterExtensionsHandler(config.ExtensionsDir)

	m.App = application.New(application.Options{
		Name:        "Clutch",
		Description: "An open source, cross-platform, extensible app launcher.",
		Assets: application.AssetOptions{
			Handler:        assetsServer.Mux,
			DisableLogging: true,
		},
		Services: services,
		LogLevel: slog.LevelError,
	})

	m.App.NewWebviewWindowWithOptions(application.WebviewWindowOptions{
		Title:         "Clutch",
		Width:         800,
		Height:        600,
		DisableResize: true,
		URL:           "/",
	})

	return m.App
}

func (m *model) SetupKeybindings(ctx context.Context) {
	mgr := keyboard.NewManager()
	mgr.SuppressRepeats()
	mgr.RegisterBinding("META+SPACE", func() {
		if m.IsVisible {
			m.App.Hide()
			m.IsVisible = false
		} else {
			m.App.Show()
			m.IsVisible = true
		}
	})

	// mgr.RegisterBinding("ESC", func() {
	// 	if m.IsVisible {
	// 		m.App.Hide()
	// 		m.IsVisible = false
	// 	}
	// })

	go func() {
		events, err := keyboard.Listen()
		if err != nil {
			log.Fatalf("Error listening to keyboard: %v", err)
		}
		for {
			select {
			case <-ctx.Done():
				return
			case ev, ok := <-events:
				if !ok {
					return
				}
				mgr.HandleEvent(ev)
			}
		}
	}()

}
