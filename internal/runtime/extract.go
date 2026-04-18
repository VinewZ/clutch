package runtime

import (
	"crypto/sha256"
	"embed"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sync"

	"github.com/charmbracelet/log"
)

//go:embed cli.cjs
var cliBundle embed.FS

const (
	cliFileName     = "cli.cjs"
	cliVersionExt   = ".version"
	runtimeFileMode = 0644
	runtimeDirMode  = 0755
)

var (
	ensureOnce sync.Once
	ensureErr  error
	runtimeDir string
)

func getRuntimeDir() string {
	if runtimeDir != "" {
		return runtimeDir
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	return filepath.Join(home, ".local", "share", "clutch", "runtime")
}

func EnsureRuntime() error {
	ensureOnce.Do(func() {
		ensureErr = ensureRuntime()
	})
	return ensureErr
}

func ensureRuntime() error {
	runtimeDirPath := getRuntimeDir()
	if runtimeDirPath == "" {
		return errors.New("cannot determine runtime directory")
	}

	data, err := cliBundle.ReadFile(cliFileName)
	if err != nil {
		return fmt.Errorf("read embedded bundle: %w", err)
	}

	currentHash := sha256.Sum256(data)
	currentHashStr := hex.EncodeToString(currentHash[:])

	runtimePath := filepath.Join(runtimeDirPath, cliFileName)
	versionPath := runtimePath + cliVersionExt

	storedHash, err := os.ReadFile(versionPath)
	if err == nil && string(storedHash) == currentHashStr {
		if _, err := os.Stat(runtimePath); err == nil {
			log.Debug("Runtime up to date", "path", runtimePath, "hash", currentHashStr[:8]+"...")
			return nil
		}
	}

	if err := os.MkdirAll(runtimeDirPath, runtimeDirMode); err != nil {
		return fmt.Errorf("create runtime directory: %w", err)
	}

	if err := writeFileAtomic(runtimePath, data, runtimeFileMode); err != nil {
		return fmt.Errorf("write runtime: %w", err)
	}

	hashData := []byte(currentHashStr)
	if err := writeFileAtomic(versionPath, hashData, runtimeFileMode); err != nil {
		return fmt.Errorf("write version: %w", err)
	}

	log.Info("Runtime extracted", "path", runtimePath, "hash", currentHashStr[:8]+"...")
	return nil
}

func writeFileAtomic(path string, data []byte, perm os.FileMode) error {
	dir := filepath.Dir(path)
	tempPath := filepath.Join(dir, "."+filepath.Base(path)+".tmp")

	if err := os.WriteFile(tempPath, data, perm); err != nil {
		return err
	}

	if err := os.Rename(tempPath, path); err != nil {
		os.Remove(tempPath)
		return err
	}

	return nil
}

func GetRuntimePath() string {
	dir := getRuntimeDir()
	if dir == "" {
		return ""
	}
	return filepath.Join(dir, cliFileName)
}
