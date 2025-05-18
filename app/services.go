package app

import (
	"github.com/wailsapp/wails/v3/pkg/application"
)

type ClutchServices struct {
	protoServerPort int
	usrHomeDir      string
}

type DesktopApp struct {
	Id          int
	Name        string
	GenericName string
	Comment     string
	Icon        string
	Exec        string
	Terminal    string
	Keywords    []string
}

func registerServices(m *model) []application.Service {
	appServices := ClutchServices{
		usrHomeDir: m.UserHomeDir,
	}
	return []application.Service{
		application.NewService(&appServices, application.DefaultServiceOptions),
	}
}

func (s *ClutchServices) GetProtoServerPort() int {
	return s.protoServerPort
}
