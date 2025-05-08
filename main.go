package main

import (
	"embed"
	_ "embed"
	"log"

	"github.com/vinewz/Moda/internal/app"
	"github.com/vinewz/Moda/internal/hotkeys"
	"golang.design/x/hotkey/mainthread"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	m := app.Model{}
	m.New(assets)

	h := hotkeys.Hotkeys{}

	mainthread.Init(func() {
		go h.ToggleApp(m)
	})

	

	if err := m.App.Run(); err != nil {
		log.Fatal(err)
	}
}
