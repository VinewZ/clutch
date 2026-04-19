package socket

import (
	"encoding/json"
	"fmt"

	"github.com/charmbracelet/log"
)

type RenderMessageHandler struct {
	renderFunc       func(extensionId string, state json.RawMessage) (json.RawMessage, error)
	onRenderResponse func(json.RawMessage)
}

func NewRenderMessageHandler() *RenderMessageHandler {
	return &RenderMessageHandler{}
}

func (h *RenderMessageHandler) SetRenderFunc(fn func(extensionId string, state json.RawMessage) (json.RawMessage, error)) {
	h.renderFunc = fn
}

func (h *RenderMessageHandler) SetOnRenderResponse(fn func(json.RawMessage)) {
	h.onRenderResponse = fn
}

func (h *RenderMessageHandler) Handle(data json.RawMessage) (*SocketResponse, error) {
	log.Debug("RenderMessageHandler.Handle called", "data", string(data))

	var base BaseMessage
	if err := json.Unmarshal(data, &base); err != nil {
		log.Error("Failed to parse message", "error", err)
		return nil, fmt.Errorf("parse message: %w", err)
	}

	log.Debug("RenderMessageHandler message parsed", "type", base.Type)

	switch base.Type {
	case "renderRequest":
		return h.handleRenderRequest(data)
	case "renderResponse":
		return h.handleRenderResponse(data)
	default:
		log.Error("Unknown RENDER type", "type", base.Type)
		return &SocketResponse{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UNKNOWN_TYPE",
				Message: "unknown RENDER type: " + base.Type,
			},
		}, nil
	}
}

func (h *RenderMessageHandler) handleRenderRequest(data json.RawMessage) (*SocketResponse, error) {
	var msg RenderRequestMessage
	if err := json.Unmarshal(data, &msg); err != nil {
		return nil, fmt.Errorf("parse render request: %w", err)
	}

	if h.renderFunc == nil {
		return &SocketResponse{
			Success: false,
			Error: &ErrorInfo{
				Code:    "NO_RENDERER",
				Message: "render function not configured",
			},
		}, nil
	}

	jsonNode, err := h.renderFunc(msg.ExtensionID, msg.State)
	if err != nil {
		return &SocketResponse{
			Success: false,
			Error: &ErrorInfo{
				Code:    "RENDER_ERROR",
				Message: err.Error(),
			},
		}, nil
	}

	return &SocketResponse{
		Success: true,
		Data:    jsonNode,
	}, nil
}

func (h *RenderMessageHandler) handleRenderResponse(data json.RawMessage) (*SocketResponse, error) {
	log.Info("Received renderResponse", "data", string(data))

	if h.onRenderResponse != nil {
		h.onRenderResponse(data)
	}

	return &SocketResponse{
		Success: true,
		Data:    data,
	}, nil
}
