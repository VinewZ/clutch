package hotkeys

import (
	"log"

	"github.com/vinewz/Moda/internal/app"
	"golang.design/x/hotkey"
)

type Hotkeys struct{ }

func (h *Hotkeys) ToggleApp(m app.Model) {
	toggleApp := hotkey.New([]hotkey.Modifier{hotkey.ModCtrl, hotkey.ModShift}, hotkey.KeyH)
	err := toggleApp.Register()
	if err != nil {
		log.Fatalf("hotkey: failed to register hotkey: %v", err)
		return
	}

	for range toggleApp.Keydown() {
    if m.IsAppVisible{
      m.App.Hide()
      m.IsAppVisible = false
    } else {
      m.App.Show()
      m.IsAppVisible = true
    }
	}
}
