package socket

import "encoding/json"

type MessageCategory string

const (
	CategoryCLI      MessageCategory = "CLI"
	CategoryRuntime  MessageCategory = "RUNTIME"
	CategoryRender   MessageCategory = "RENDER"
	CategoryInternal MessageCategory = "INTERNAL"
)

type BaseMessage struct {
	Category    MessageCategory `json:"category"`
	Type        string          `json:"type"`
	ExtensionID string          `json:"extensionId,omitempty"`
}

// CLI Messages
type CLIMessage struct {
	Category MessageCategory `json:"category"`
	Type     string          `json:"type"`
}

// RUNTIME Messages
type RuntimeEventMessage struct {
	Category    MessageCategory `json:"category"`
	Type        string          `json:"type"`
	ExtensionID string          `json:"extensionId"`
	HandlerID   string          `json:"handlerId"`
	Event       json.RawMessage `json:"event"`
}

type RuntimeActionMessage struct {
	Category    MessageCategory `json:"category"`
	Type        string          `json:"type"`
	ExtensionID string          `json:"extensionId"`
	Action      json.RawMessage `json:"action"`
}

type NavigationPopMessage struct {
	Category    MessageCategory `json:"category"`
	Type        string          `json:"type"`
	ExtensionID string          `json:"extensionId"`
}

type ToastOptions struct {
	Style   string `json:"style,omitempty"`
	Title   string `json:"title"`
	Message string `json:"message,omitempty"`
}

type ToastShowMessage struct {
	Category    MessageCategory `json:"category"`
	Type        string          `json:"type"`
	ExtensionID string          `json:"extensionId"`
	ToastID     string          `json:"toastId"`
	Style       string          `json:"style,omitempty"`
	Title       string          `json:"title"`
	Message     string          `json:"message,omitempty"`
}

type ToastUpdateMessage struct {
	Category    MessageCategory        `json:"category"`
	Type        string                 `json:"type"`
	ExtensionID string                 `json:"extensionId"`
	ToastID     string                 `json:"toastId"`
	Updates     map[string]interface{} `json:"updates"`
}

type ToastHideMessage struct {
	Category    MessageCategory `json:"category"`
	Type        string          `json:"type"`
	ExtensionID string          `json:"extensionId"`
	ToastID     string          `json:"toastId"`
}

// RENDER Messages
type RenderRequestMessage struct {
	Category    MessageCategory `json:"category"`
	Type        string          `json:"type"`
	ExtensionID string          `json:"extensionId"`
	State       json.RawMessage `json:"state"`
}

type RenderResponseMessage struct {
	Category    MessageCategory `json:"category"`
	Type        string          `json:"type"`
	ExtensionID string          `json:"extensionId"`
	JSON        json.RawMessage `json:"json"`
}

// INTERNAL Messages
type RuntimeStartMessage struct {
	Category         MessageCategory        `json:"category"`
	Type             string                 `json:"type"`
	ExtensionID      string                 `json:"extensionId"`
	ExtensionPath    string                 `json:"extensionPath"`
	ExtensionCommand string                 `json:"extensionCommand"`
	Preferences      map[string]interface{} `json:"preferences,omitempty"`
}

type RuntimeStopMessage struct {
	Category    MessageCategory `json:"category"`
	Type        string          `json:"type"`
	ExtensionID string          `json:"extensionId"`
}

type InternalErrorMessage struct {
	Category    MessageCategory `json:"category"`
	Type        string          `json:"type"`
	ExtensionID string          `json:"extensionId"`
	Code        string          `json:"code,omitempty"`
	Message     string          `json:"message,omitempty"`
}

// Response types
type SocketResponse struct {
	Success bool            `json:"success"`
	Data    json.RawMessage `json:"data,omitempty"`
	Error   *ErrorInfo      `json:"error,omitempty"`
}

type ErrorInfo struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}
