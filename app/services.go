package app

import (

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

func (s *ClutchServices) ToggleApp(){
	if s.IsVisible {
		s.App.Hide()
		s.IsVisible = false
	} else {
		s.App.Show()
		s.IsVisible = true
	}
}
