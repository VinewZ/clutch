package app

import (
	"encoding/json"
	"io"
	"os"
)

type ClutchPkgJson struct {
	Clutch struct {
		Name            string `json:"name"`
		Description     string `json:"description"`
		LongDescription string `json:"longDescription"`
		Dev             struct {
			DistDir string `json:"distDir"`
			DevURL  string `json:"devUrl"`
		} `json:"dev"`
	} `json:"clutch"`
}

func (s *ClutchServices) ParseExtensionPkgJson(filePath string) (*ClutchPkgJson, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	fBody, err := io.ReadAll(f)
	if err != nil {
		return nil, err
	}

	var pkgInfo ClutchPkgJson
	err = json.Unmarshal(fBody, &pkgInfo)
	if err != nil {
		return nil, err
	}

	return &pkgInfo, nil
}
