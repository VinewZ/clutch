package setup

import "github.com/vinewz/clutch/utils"

type ServersPorts struct {
	RPCServerPort int
}

var PossiblePorts = []int{9023, 9024, 9025, 9026, 9027, 9028, 9029, 9030, 9031, 9032, 9033}

func Ports() (*ServersPorts, error) {
	rpcServerPort, err := utils.FindAvailablePort(PossiblePorts)
	if err != nil {
		return nil, err
	}

	return &ServersPorts{
		RPCServerPort: rpcServerPort,
	}, nil
}
