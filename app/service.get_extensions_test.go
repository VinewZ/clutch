package app

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/vinewz/clutch/setup"
)

func TestGetExtensions(t *testing.T) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		t.Fatalf("couldn't get user config dir: %s", err.Error())
	}

	s := &ClutchServices{
		Model: &Model{
			Directories: setup.Directories{
				ExtensionsDir: filepath.Join(configDir, "clutch", "extensions"),
			},
		},
	}

	// Run the function
	s.GetExtensions()

	// You can assert things here or just use for debugging output
}
