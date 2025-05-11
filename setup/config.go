package setup 

import (
	"os"
	"path/filepath"
)

type Setup struct {
	UserHomeDir   string
	ClutchDir string
	ExtensionsDir string
}

func NewSetup() *Setup {
	return &Setup{}
}

func (s *Setup) Config() error {
	userHomeDir, err := os.UserHomeDir()
	if err != nil {
		return err
	}
	s.UserHomeDir = userHomeDir

	s.ClutchDir = filepath.Join(userHomeDir, ".config", "clutch")
	if _, err := os.Stat(s.ClutchDir); os.IsNotExist(err) {
		if err := os.MkdirAll(s.ClutchDir, 0755); err != nil {
			return err
		}
	}
	s.ExtensionsDir = filepath.Join(s.ClutchDir, "extensions")
	if _, err := os.Stat(s.ExtensionsDir); os.IsNotExist(err) {
		if err := os.MkdirAll(s.ExtensionsDir, 0755); err != nil {
			return err
		}
	}

	return nil
}
