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

	Mu        *sync.Mutex
	ConfirmCh chan bool
}

func NewClutchService(m *Model) *ClutchServices {
	return &ClutchServices{
		Model:     m,
		Mu:        &sync.Mutex{},
		ConfirmCh: make(chan bool, 1),
	}
}

func (m *Model) RegisterServices(services *ClutchServices) []application.Service {
	m.Services = []application.Service{
		application.NewService(services, application.DefaultServiceOptions),
	}
	return m.Services
}
