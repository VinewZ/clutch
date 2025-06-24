package app

import (
	"sync"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type DesktopApp struct {
	ID          int      `json:"id"`
	Name        string   `json:"name"`
	GenericName string   `json:"genericName"`
	Comment     string   `json:"comment"`
	Icon        string   `json:"icon"`
	Exec        string   `json:"exec"`
	Terminal    bool     `json:"terminal"`
	Keywords    []string `json:"keywords"`
}

type ClutchServices struct {
	*Model
	mu         sync.Mutex
	pendingCmd string
	confirmCh  chan bool
}

func NewClutchService(m *Model) *ClutchServices {
	return &ClutchServices{Model: m}
}

func (m *Model) RegisterServices() []application.Service {
	clutch := NewClutchService(m)
	m.Services = []application.Service{
		application.NewService(clutch, application.DefaultServiceOptions),
	}
	return m.Services
}

