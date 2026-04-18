package runtime

import (
	"embed"
	"os"
	"path/filepath"
	"sync"

	"github.com/charmbracelet/log"
)

//go:embed all:cli.cjs
var cliBundle embed.FS

const (
	cliFileName = "cli.cjs"
)

var (
	extractOnce sync.Once
	extractErr  error
	runtimePath string
)

func getRuntimeDir() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".local", "share", "clutch", "runtime")
}

func EnsureRuntime() error {
	extractOnce.Do(func() {
		runtimePath = filepath.Join(getRuntimeDir(), cliFileName)

		info, err := os.Stat(runtimePath)
		if err == nil && info.Size() > 0 {
			log.Debug("Runtime already exists", "path", runtimePath)
			return
		}

		if err := os.MkdirAll(filepath.Dir(runtimePath), 0755); err != nil {
			extractErr = err
			log.Error("Failed to create runtime directory", "error", err)
			return
		}

		data, err := cliBundle.ReadFile(cliFileName)
		if err != nil {
			extractErr = err
			log.Error("Failed to read embedded CLI bundle", "error", err)
			return
		}

		extractErr = os.WriteFile(runtimePath, data, 0644)
		if extractErr != nil {
			log.Error("Failed to write CLI bundle", "error", extractErr)
			return
		}

		log.Info("Runtime extracted", "path", runtimePath)
	})

	return extractErr
}

func GetRuntimePath() string {
	return runtimePath
}
