package app

import (
	"os"
	"path/filepath"
)

func (s *ClutchServices) GetExtensions() ([]ClutchPkgJson, error) {
	extensionsDir, err := os.ReadDir(s.Model.Directories.ExtensionsDir)
	if err != nil {
		return nil, err
	}

	var extensionsJsons []ClutchPkgJson

	for _, dir := range extensionsDir {
		pkgJson, err := s.ParseExtensionPkgJson(filepath.Join(s.Model.Directories.ExtensionsDir, dir.Name(), "package.json"))
		if err != nil {
			return nil, err
		}
		extensionsJsons = append(extensionsJsons, *pkgJson)
	}

	return extensionsJsons, nil
}
