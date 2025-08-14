package setup

import (
	"os"
	"path/filepath"
)

type Directories struct {
	UserConfigDir string
	UserHomeDir   string
	ClutchDir     string
	ExtensionsDir string
}

func Dirs() (*Directories, error) {
	userHomeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}

	userConfigDir, err := os.UserConfigDir()
	if err != nil {
		return nil, err
	}

	clutchDir := filepath.Join(userConfigDir, "clutch")
	if _, err := os.Stat(clutchDir); os.IsNotExist(err) {
		if err := os.MkdirAll(clutchDir, 0755); err != nil {
			return nil, err
		}
	}

	extensionsDir := filepath.Join(clutchDir, "extensions")
	if _, err := os.Stat(extensionsDir); os.IsNotExist(err) {
		if err := os.MkdirAll(extensionsDir, 0755); err != nil {
			return nil, err
		}
	}

	return &Directories{
		UserHomeDir:   userHomeDir,
		UserConfigDir: userConfigDir,
		ClutchDir:     clutchDir,
		ExtensionsDir: extensionsDir,
	}, nil
}
