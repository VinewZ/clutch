package utils

import (
	"fmt"
	"net"
	"strconv"
)

func FindAvailablePort(ports []int) (int, error) {
	host := "127.0.0.1"
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
