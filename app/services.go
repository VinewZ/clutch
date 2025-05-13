package app

import (
	"log"

	"github.com/vinewz/clutch/backend/api"
	"github.com/vinewz/clutch/utils"
	"github.com/wailsapp/wails/v3/pkg/application"
)

type ClutchServices struct {
	extensionsServerPort int
	protoServerPort      int
}

func registerServices(m *model) []application.Service {
	appServices := ClutchServices{
		extensionsServerPort: m.ExtensionServerPort,
		protoServerPort:      m.ProtoServerPort,
	}
	return []application.Service{

		application.NewService(&appServices, application.DefaultServiceOptions),
	}
}

func (m *ClutchServices) GetExtensionsServerPort() int {
	return m.extensionsServerPort
}

func (m *ClutchServices) GetProtoServerPort() int {
	return m.protoServerPort
}

func (m *ClutchServices) GetDevExtensionPort() int {
	return m.deve
}

func (m *ClutchServices) AddDevExtension(path string) {
	port, err := utils.FindAvailablePort()
	if err != nil {
		log.Fatalf("Couldn't start dev extensions server: %s", err.Error())
	}
	devServer := api.NewDevExtensionsServer(port)
	





	devServer.RegisterDevExtensionsHandler(path)
}

