package actions

import (
	"fmt"

	"github.com/charmbracelet/log"
)

type ActionResult struct {
	Title   string
	Message string
	Error   error
}

type ActionHandler func(props map[string]interface{}) ActionResult

type Dispatcher struct {
	handlers map[string]ActionHandler
}

func NewDispatcher() *Dispatcher {
	d := &Dispatcher{
		handlers: make(map[string]ActionHandler),
	}
	d.registerDefaults()
	return d
}

func (d *Dispatcher) Register(actionType string, handler ActionHandler) {
	d.handlers[actionType] = handler
}

func (d *Dispatcher) Dispatch(actionType string, props map[string]interface{}) ActionResult {
	handler, ok := d.handlers[actionType]
	if !ok {
		log.Warn("Unknown built-in action", "action", actionType)
		return ActionResult{
			Error: fmt.Errorf("unknown action: %s", actionType),
		}
	}
	return handler(props)
}

func (d *Dispatcher) registerDefaults() {
	d.Register("Action.CopyToClipboard", handleCopyToClipboard)
	d.Register("Action.Open", handleOpen)
	d.Register("Action.OpenInBrowser", handleOpenInBrowser)
	d.Register("Action.OpenWith", handleOpenWith)
	d.Register("Action.Paste", handlePaste)
	d.Register("Action.ShowInFinder", handleShowInFinder)
	d.Register("Action.Trash", handleTrash)
}
