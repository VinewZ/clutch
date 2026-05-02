package socket

import (
	"encoding/json"
	"fmt"
)

type RuntimeMessageHandler struct {
	eventDispatcher func(extensionId, handlerId string, event json.RawMessage) (json.RawMessage, error)
	onToastMessage  func(data json.RawMessage)
}

func NewRuntimeMessageHandler() *RuntimeMessageHandler {
	return &RuntimeMessageHandler{}
}

func (h *RuntimeMessageHandler) SetEventDispatcher(fn func(extensionId, handlerId string, event json.RawMessage) (json.RawMessage, error)) {
	h.eventDispatcher = fn
}

func (h *RuntimeMessageHandler) SetOnToastMessage(fn func(data json.RawMessage)) {
	h.onToastMessage = fn
}

func (h *RuntimeMessageHandler) Handle(data json.RawMessage) (*SocketResponse, error) {
	var base BaseMessage
	if err := json.Unmarshal(data, &base); err != nil {
		return nil, fmt.Errorf("parse message: %w", err)
	}

	switch base.Type {
	case "ready":
		return h.handleReady(data)
	case "event":
		return h.handleEvent(data)
	case "action":
		return h.handleAction(data)
	case "toastShow":
		return h.handleToastMessage(data)
	case "toastUpdate":
		return h.handleToastMessage(data)
	case "toastHide":
		return h.handleToastMessage(data)
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

func (h *RuntimeMessageHandler) handleReady(data json.RawMessage) (*SocketResponse, error) {
	var msg RuntimeReadyMessage
	if err := json.Unmarshal(data, &msg); err != nil {
		return nil, fmt.Errorf("parse ready message: %w", err)
	}

	responseData, _ := json.Marshal(map[string]string{
		"extensionId": msg.ExtensionID,
	})

	return &SocketResponse{
		Success: true,
		Data:    responseData,
	}, nil
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

func (h *RuntimeMessageHandler) handleToastMessage(data json.RawMessage) (*SocketResponse, error) {
	if h.onToastMessage != nil {
		h.onToastMessage(data)
	}

	return &SocketResponse{
		Success: true,
		Data:    data,
	}, nil
}
