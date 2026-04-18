package extension

import "encoding/json"

type Extension struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Path        string `json:"path"`
	Command     string `json:"command"`
	Description string `json:"description,omitempty"`
}

type ExtensionState struct {
	ExtensionID string      `json:"extensionId"`
	State       interface{} `json:"state"`
}

type RenderResult struct {
	ExtensionID string          `json:"extensionId"`
	JSON        json.RawMessage `json:"json"`
}

type EventResult struct {
	ExtensionID string          `json:"extensionId"`
	HandlerID   string          `json:"handlerId"`
	Event       json.RawMessage `json:"event"`
}
