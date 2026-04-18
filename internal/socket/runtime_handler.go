package socket

import (
	"encoding/json"
	"fmt"
)

type RuntimeMessageHandler struct {
	eventDispatcher func(extensionId, handlerId string, event json.RawMessage) (json.RawMessage, error)
}

func NewRuntimeMessageHandler() *RuntimeMessageHandler {
	return &RuntimeMessageHandler{}
}

func (h *RuntimeMessageHandler) SetEventDispatcher(fn func(extensionId, handlerId string, event json.RawMessage) (json.RawMessage, error)) {
	h.eventDispatcher = fn
}

func (h *RuntimeMessageHandler) Handle(data json.RawMessage) (*SocketResponse, error) {
	var base BaseMessage
	if err := json.Unmarshal(data, &base); err != nil {
		return nil, fmt.Errorf("parse message: %w", err)
	}

	switch base.Type {
	case "event":
		return h.handleEvent(data)
	case "action":
		return h.handleAction(data)
	default:
		return &SocketResponse{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UNKNOWN_TYPE",
				Message: "unknown RUNTIME type: " + base.Type,
			},
		}, nil
	}
}

func (h *RuntimeMessageHandler) handleEvent(data json.RawMessage) (*SocketResponse, error) {
	var msg RuntimeEventMessage
	if err := json.Unmarshal(data, &msg); err != nil {
		return nil, fmt.Errorf("parse event message: %w", err)
	}

	if h.eventDispatcher == nil {
		return &SocketResponse{
			Success: false,
			Error: &ErrorInfo{
				Code:    "NO_DISPATCHER",
				Message: "event dispatcher not configured",
			},
		}, nil
	}

	action, err := h.eventDispatcher(msg.ExtensionID, msg.HandlerID, msg.Event)
	if err != nil {
		return &SocketResponse{
			Success: false,
			Error: &ErrorInfo{
				Code:    "DISPATCH_ERROR",
				Message: err.Error(),
			},
		}, nil
	}

	responseData, _ := json.Marshal(map[string]interface{}{
		"action": action,
	})

	return &SocketResponse{
		Success: true,
		Data:    responseData,
	}, nil
}

func (h *RuntimeMessageHandler) handleAction(data json.RawMessage) (*SocketResponse, error) {
	var msg RuntimeActionMessage
	if err := json.Unmarshal(data, &msg); err != nil {
		return nil, fmt.Errorf("parse action message: %w", err)
	}

	return &SocketResponse{
		Success: true,
		Data:    data,
	}, nil
}
