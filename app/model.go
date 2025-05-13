package app

import (
	"context"
	e "embed"
	"log"

	keyboard "github.com/VinewZ/go-evdev-keyboard"
	"github.com/vinewz/clutch/setup"
	"github.com/wailsapp/wails/v3/pkg/application"
)

type model struct {
	App                    *application.App
	IsVisible              bool
	ExtensionServerPort    int
	ProtoServerPort        int
	DevExtensionServerPort int
}

func NewModel(extensionServerPort, protoServerPort int) *model {
	return &model{
		IsVisible:           true,
		ExtensionServerPort: extensionServerPort,
		ProtoServerPort:     protoServerPort,
		DevExtensionServerPort:     protoServerPort,
	}
}

func (m *model) Setup(assets e.FS, config *setup.Setup) *application.App {
	services := registerServices(m)

	m.App = application.New(application.Options{
		Name:        "Clutch",
		Description: "An open source, cross-platform, extensible app launcher.",
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Services: services,
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
