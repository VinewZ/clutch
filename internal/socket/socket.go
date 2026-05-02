package socket

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/charmbracelet/log"
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

type CLIHandler func(cmd string) error
type RuntimeHandler func(msg json.RawMessage) (*SocketResponse, error)
type RenderHandler func(msg json.RawMessage) (*SocketResponse, error)
type InternalHandler func(msg json.RawMessage) (*SocketResponse, error)

type Server struct {
	path             string
	handler          Handler
	cliHandler       CLIHandler
	runtimeHandler   RuntimeHandler
	renderHandler    RenderHandler
	internalHandler  InternalHandler
	mu               sync.RWMutex
	runtimeConns     map[string]net.Conn
	runtimeWriters   map[string]*bufio.Writer
	runtimeWriteMu   map[string]*sync.Mutex
	onRuntimeConnect func(extensionID string)
}

func NewServer(handler Handler) *Server {
	return &Server{
		path:           SocketPath(),
		handler:        handler,
		runtimeConns:   make(map[string]net.Conn),
		runtimeWriters: make(map[string]*bufio.Writer),
		runtimeWriteMu: make(map[string]*sync.Mutex),
	}
}

func (s *Server) SetHandlers(
	cli CLIHandler,
	runtime RuntimeHandler,
	render RenderHandler,
	internal InternalHandler,
) {
	s.cliHandler = cli
	s.runtimeHandler = runtime
	s.renderHandler = render
	s.internalHandler = internal
}

func (s *Server) SetOnRuntimeConnect(fn func(extensionID string)) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.onRuntimeConnect = fn
}

func (s *Server) IsRuntimeConnected(extensionID string) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	_, ok := s.runtimeConns[extensionID]
	return ok
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
	log.Debug("New socket connection accepted", "remote", conn.RemoteAddr().String())

	reader := bufio.NewReader(conn)
	writer := bufio.NewWriter(conn)

	data, err := reader.ReadString('\n')
	if err != nil {
		log.Error("Failed to read from socket", "error", err)
		s.sendError(writer, "READ_FAILED", "read failed: "+err.Error())
		conn.Close()
		return
	}
	log.Debug("Received raw message", "data", data[:len(data)-1])

	var base BaseMessage
	if err := json.Unmarshal([]byte(data), &base); err != nil {
		log.Error("Failed to parse JSON", "error", err, "data", data)
		s.sendError(writer, "INVALID_JSON", "invalid JSON: "+err.Error())
		conn.Close()
		return
	}
	log.Debug("Parsed message", "category", base.Category, "type", base.Type, "extensionId", base.ExtensionID)

	if base.Category == CategoryRuntime && base.ExtensionID != "" {
		if base.Type != "ready" {
			log.Error("First RUNTIME message must be 'ready', got", "type", base.Type)
			s.sendError(writer, "INVALID_HANDSHAKE", "first RUNTIME message must be type 'ready', got: "+base.Type)
			conn.Close()
			return
		}
		s.handleRuntimeConnection(conn, reader, writer, base.ExtensionID, data)
		return
	}

	var response *SocketResponse
	switch base.Category {
	case CategoryCLI:
		log.Debug("Routing to CLI handler")
		response = s.handleCLI([]byte(data))
	case CategoryRender:
		log.Debug("Routing to RENDER handler")
		response = s.handleRender([]byte(data))
	case CategoryInternal:
		log.Debug("Routing to INTERNAL handler")
		response = s.handleInternal([]byte(data))
	default:
		log.Error("Unknown message category", "category", base.Category)
		response = &SocketResponse{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UNKNOWN_CATEGORY",
				Message: "unknown category: " + string(base.Category),
			},
		}
	}

	s.sendResponse(writer, response)
	log.Debug("Response sent", "success", response.Success)
	conn.Close()
}

func (s *Server) handleRuntimeConnection(conn net.Conn, reader *bufio.Reader, writer *bufio.Writer, extensionID, firstData string) {
	writeMu := &sync.Mutex{}

	s.mu.Lock()
	s.runtimeConns[extensionID] = conn
	s.runtimeWriters[extensionID] = writer
	s.runtimeWriteMu[extensionID] = writeMu
	onConnect := s.onRuntimeConnect
	s.mu.Unlock()

	log.Debug("Runtime connection registered", "extensionId", extensionID)

	if onConnect != nil {
		onConnect(extensionID)
	}

	defer func() {
		s.mu.Lock()
		delete(s.runtimeConns, extensionID)
		delete(s.runtimeWriters, extensionID)
		delete(s.runtimeWriteMu, extensionID)
		s.mu.Unlock()
		conn.Close()
		log.Debug("Runtime connection closed", "extensionId", extensionID)
	}()

	for {
		var data string
		if firstData != "" {
			data = firstData
			firstData = ""
		} else {
			line, err := reader.ReadString('\n')
			if err != nil {
				log.Debug("Runtime connection read error", "extensionId", extensionID, "error", err)
				return
			}
			data = line
		}

		log.Debug("Received runtime message", "extensionId", extensionID, "data", data[:len(data)-1])

		var base BaseMessage
		if err := json.Unmarshal([]byte(data), &base); err != nil {
			log.Error("Failed to parse runtime JSON", "error", err)
			writeMu.Lock()
			s.sendResponse(writer, &SocketResponse{
				Success: false,
				Error: &ErrorInfo{
					Code:    "INVALID_JSON",
					Message: err.Error(),
				},
			})
			writeMu.Unlock()
			continue
		}

		var response *SocketResponse
		skipResponse := false
		switch base.Category {
		case CategoryRuntime:
			response = s.handleRuntime([]byte(data))
		case CategoryRender:
			response = s.handleRender([]byte(data))
			if base.Type == "renderResponse" {
				skipResponse = true
			}
		case CategoryInternal:
			response = s.handleInternal([]byte(data))
		default:
			log.Error("Unknown message category in runtime connection", "category", base.Category)
			response = &SocketResponse{
				Success: false,
				Error: &ErrorInfo{
					Code:    "UNKNOWN_CATEGORY",
					Message: "unknown category: " + string(base.Category),
				},
			}
		}
		log.Debug("[handleRuntimeConnection] handled message", "extensionId", extensionID, "category", base.Category, "type", base.Type, "success", response.Success)
		if !skipResponse {
			writeMu.Lock()
			s.sendResponse(writer, response)
			writeMu.Unlock()
		}
	}
}

func (s *Server) sendResponse(writer *bufio.Writer, response *SocketResponse) {
	jsonBytes, err := json.Marshal(response)
	if err != nil {
		jsonBytes, _ = json.Marshal(&SocketResponse{
			Success: false,
			Error: &ErrorInfo{
				Code:    "MARSHAL_ERROR",
				Message: err.Error(),
			},
		})
	}
	writer.WriteString(string(jsonBytes) + "\n")
	writer.Flush()
}

func (s *Server) sendError(writer *bufio.Writer, code, message string) {
	response := &SocketResponse{
		Success: false,
		Error: &ErrorInfo{
			Code:    code,
			Message: message,
		},
	}
	s.sendResponse(writer, response)
}

func (s *Server) handleCLI(data []byte) *SocketResponse {
	var msg CLIMessage
	if err := json.Unmarshal(data, &msg); err != nil {
		return &SocketResponse{
			Success: false,
			Error: &ErrorInfo{
				Code:    "PARSE_ERROR",
				Message: err.Error(),
			},
		}
	}

	if s.cliHandler == nil {
		if s.handler != nil {
			if err := s.handler(Command(msg.Type)); err != nil {
				return &SocketResponse{
					Success: false,
					Error: &ErrorInfo{
						Code:    "HANDLER_ERROR",
						Message: err.Error(),
					},
				}
			}
			responseData, _ := json.Marshal(map[string]string{
				"category": "CLI",
				"type":     msg.Type,
			})
			return &SocketResponse{
				Success: true,
				Data:    responseData,
			}
		}
		return &SocketResponse{
			Success: false,
			Error: &ErrorInfo{
				Code:    "NO_HANDLER",
				Message: "CLI handler not configured",
			},
		}
	}

	if err := s.cliHandler(msg.Type); err != nil {
		return &SocketResponse{
			Success: false,
			Error: &ErrorInfo{
				Code:    "HANDLER_ERROR",
				Message: err.Error(),
			},
		}
	}

	responseData, _ := json.Marshal(map[string]string{
		"category": "CLI",
		"type":     msg.Type,
	})
	return &SocketResponse{
		Success: true,
		Data:    responseData,
	}
}

func (s *Server) handleRuntime(data []byte) *SocketResponse {
	if s.runtimeHandler == nil {
		return &SocketResponse{
			Success: false,
			Error: &ErrorInfo{
				Code:    "NO_HANDLER",
				Message: "RUNTIME handler not configured",
			},
		}
	}

	resp, err := s.runtimeHandler(data)
	if err != nil {
		return &SocketResponse{
			Success: false,
			Error: &ErrorInfo{
				Code:    "HANDLER_ERROR",
				Message: err.Error(),
			},
		}
	}

	return resp
}

func (s *Server) handleRender(data []byte) *SocketResponse {
	if s.renderHandler == nil {
		return &SocketResponse{
			Success: false,
			Error: &ErrorInfo{
				Code:    "NO_HANDLER",
				Message: "RENDER handler not configured",
			},
		}
	}

	resp, err := s.renderHandler(data)
	if err != nil {
		return &SocketResponse{
			Success: false,
			Error: &ErrorInfo{
				Code:    "HANDLER_ERROR",
				Message: err.Error(),
			},
		}
	}

	return resp
}

func (s *Server) handleInternal(data []byte) *SocketResponse {
	if s.internalHandler == nil {
		return &SocketResponse{
			Success: false,
			Error: &ErrorInfo{
				Code:    "NO_HANDLER",
				Message: "INTERNAL handler not configured",
			},
		}
	}

	resp, err := s.internalHandler(data)
	if err != nil {
		return &SocketResponse{
			Success: false,
			Error: &ErrorInfo{
				Code:    "HANDLER_ERROR",
				Message: err.Error(),
			},
		}
	}

	return resp
}

func (s *Server) Stop() error {
	s.mu.Lock()
	for extID, conn := range s.runtimeConns {
		conn.Close()
		delete(s.runtimeConns, extID)
	}
	s.mu.Unlock()
	os.Remove(s.path)
	return nil
}

func (s *Server) SendToRuntime(extensionID string, msg any) error {
	s.mu.RLock()
	conn, exists := s.runtimeConns[extensionID]
	writer := s.runtimeWriters[extensionID]
	writeMu := s.runtimeWriteMu[extensionID]
	s.mu.RUnlock()

	if !exists {
		log.Error("[SendToRuntime] runtime not connected", "extensionId", extensionID, "registeredConns", len(s.runtimeConns))
		return fmt.Errorf("runtime not connected: %s", extensionID)
	}

	jsonBytes, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("marshal message: %w", err)
	}

	log.Info("[SendToRuntime] writing to runtime", "extensionId", extensionID, "msgLen", len(jsonBytes))

	writeMu.Lock()
	defer writeMu.Unlock()

	if _, err := writer.WriteString(string(jsonBytes) + "\n"); err != nil {
		log.Error("[SendToRuntime] write failed", "extensionId", extensionID, "error", err)
		return fmt.Errorf("write message: %w", err)
	}
	if err := writer.Flush(); err != nil {
		log.Error("[SendToRuntime] flush failed", "extensionId", extensionID, "error", err)
		return fmt.Errorf("flush message: %w", err)
	}

	_ = conn
	return nil
}

func (s *Server) RemoveRuntimeConn(extensionID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.runtimeConns, extensionID)
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

	message := CLIMessage{
		Category: CategoryCLI,
		Type:     string(cmd),
	}
	jsonBytes, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("marshal message: %w", err)
	}

	writer := bufio.NewWriter(conn)
	writer.WriteString(string(jsonBytes) + "\n")
	writer.Flush()

	conn.SetReadDeadline(time.Now().Add(100 * time.Millisecond))

	reader := bufio.NewReader(conn)
	data, err := reader.ReadString('\n')
	if err != nil {
		return fmt.Errorf("read response: %w", err)
	}

	var response SocketResponse
	if err := json.Unmarshal([]byte(data), &response); err != nil {
		return fmt.Errorf("parse response: %w", err)
	}

	if !response.Success {
		if response.Error != nil {
			return fmt.Errorf("server error: %s", response.Error.Message)
		}
		return fmt.Errorf("server error: unknown")
	}

	return nil
}
