package socket

import (
	"bufio"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const SocketName = "clutch.sock"

func SocketPath() string {
	if runtimeDir := os.Getenv("XDG_RUNTIME_DIR"); runtimeDir != "" {
		return filepath.Join(runtimeDir, SocketName)
	}
	return filepath.Join("/tmp", SocketName)
}

type Command string

const (
	CmdToggle Command = "toggle"
	CmdShow   Command = "show"
	CmdHide   Command = "hide"
	CmdQuit   Command = "quit"
)

type Handler func(cmd Command) error

type Server struct {
	path    string
	handler Handler
}

func NewServer(handler Handler) *Server {
	return &Server{
		path:    SocketPath(),
		handler: handler,
	}
}

func (s *Server) Start() error {
	if err := os.RemoveAll(s.path); err != nil {
		return fmt.Errorf("remove existing socket: %w", err)
	}

	listener, err := net.Listen("unix", s.path)
	if err != nil {
		return fmt.Errorf("listen on socket: %w", err)
	}

	if err := os.Chmod(s.path, 0700); err != nil {
		listener.Close()
		return fmt.Errorf("chmod socket: %w", err)
	}

	go func() {
		for {
			conn, err := listener.Accept()
			if err != nil {
				if strings.Contains(err.Error(), "use of closed") {
					return
				}
				continue
			}
			go s.handleConn(conn)
		}
	}()

	return nil
}

func (s *Server) handleConn(conn net.Conn) {
	defer conn.Close()

	reader := bufio.NewReader(conn)
	writer := bufio.NewWriter(conn)

	data, err := reader.ReadString('\n')
	if err != nil {
		writer.WriteString("error: read failed\n")
		writer.Flush()
		return
	}

	cmd := Command(strings.TrimSpace(data))
	if err := s.handler(cmd); err != nil {
		writer.WriteString(fmt.Sprintf("error: %s\n", err.Error()))
		writer.Flush()
		return
	}

	writer.WriteString("ok\n")
	writer.Flush()
}

func (s *Server) Stop() error {
	os.Remove(s.path)
	return nil
}

type Client struct {
	path string
}

func NewClient() *Client {
	return &Client{path: SocketPath()}
}

func (c *Client) Send(cmd Command) error {
	conn, err := net.Dial("unix", c.path)
	if err != nil {
		return fmt.Errorf("connect to server: %w", err)
	}
	defer conn.Close()

	conn.SetWriteDeadline(time.Now().Add(100 * time.Millisecond))

	writer := bufio.NewWriter(conn)
	writer.WriteString(string(cmd) + "\n")
	writer.Flush()

	conn.SetReadDeadline(time.Now().Add(100 * time.Millisecond))

	reader := bufio.NewReader(conn)
	data, err := reader.ReadString('\n')
	if err != nil {
		return fmt.Errorf("read response: %w", err)
	}

	response := strings.TrimSpace(data)
	if response != "ok" {
		return fmt.Errorf("server error: %s", response)
	}

	return nil
}
