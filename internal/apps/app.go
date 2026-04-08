package apps

import (
	"github.com/wailsapp/wails/v3/pkg/application"
)

type AppController struct {
	window application.Window
}

func (ac *AppController) SetWindow(w application.Window) {
	ac.window = w
}

func (ac *AppController) Show() {
	if ac.window != nil {
		ac.window.Show()
	}
}

func (ac *AppController) Hide() {
	if ac.window != nil {
		ac.window.Hide()
	}
}

func (ac *AppController) Toggle() {
	if ac.window == nil {
		return
	}
	if ac.window.IsVisible() {
		ac.window.Hide()
	} else {
		ac.window.Show()
	}
}
