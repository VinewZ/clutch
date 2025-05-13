package utils

import (
	"fmt"
	"net"
	"strconv"
)

func FindAvailablePort() (int, error) {
	host := "127.0.0.1"
	ports := []int{9023, 9024, 9025, 9026, 9027, 9028, 9029, 9030, 9031, 9032, 9033}

	for _, port := range ports {
		addr := net.JoinHostPort(host, strconv.Itoa(port))
		listener, err := net.Listen("tcp", addr)
		if err == nil {
			listener.Close()
			return port, nil
		}
	}
	return -1, fmt.Errorf("No available port found")
}
