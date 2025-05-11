package main

import (
	"context"
	"embed"
	"log"

	"github.com/VinewZ/go-evdev-keyboard"
	"github.com/vinewz/clutch/app"
	"github.com/vinewz/clutch/setup"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	set := setup.NewSetup()
	err := set.Config()
	if err != nil {
		log.Fatalf("Failed to setup config: %v", err)
	}

	m := app.NewModel()
	m.Init(assets, set)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

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

	mgr.RegisterBinding("ESC", func() {
		if m.IsVisible {
			m.App.Hide()
			m.IsVisible = false
		}
	})

	go func() {
		events, err := keyboard.Listen()
		if err != nil {
			log.Fatalf("cannot listen: %v", err)
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

	m.App.OnShutdown(func() {
		cancel()
	})

	if err := m.App.Run(); err != nil {
		log.Fatal(err)
	}
}
