package store

import (
	"archive/zip"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type Installer struct {
	client *http.Client
}

func NewInstaller() *Installer {
	return &Installer{
		client: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

func (i *Installer) Install(downloadURL, name string) error {
	extDir := filepath.Join(getExtensionDir(), name)

	if err := os.MkdirAll(extDir, 0755); err != nil {
		return err
	}

	tmpFile, err := os.CreateTemp("", "extension-*.zip")
	if err != nil {
		return err
	}
	tmpPath := tmpFile.Name()
	defer os.Remove(tmpPath)
	defer tmpFile.Close()

	resp, err := i.client.Get(downloadURL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if _, err := io.Copy(tmpFile, resp.Body); err != nil {
		return err
	}

	if err := tmpFile.Close(); err != nil {
		return err
	}

	if err := i.extractZip(tmpPath, extDir); err != nil {
		os.RemoveAll(extDir)
		return err
	}

	return nil
}

func (i *Installer) extractZip(zipPath, dest string) error {
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return err
	}
	defer r.Close()

	for _, f := range r.File {
		if err := i.extractFile(f, dest); err != nil {
			return err
		}
	}

	return nil
}

func (i *Installer) extractFile(f *zip.File, dest string) error {
	name := f.Name

	if strings.Contains(name, "..") {
		return nil
	}

	if strings.HasPrefix(name, "__MACOSX") || strings.HasPrefix(filepath.Base(name), "._") {
		return nil
	}

	if f.Mode().IsDir() {
		return nil
	}

	dstPath := filepath.Join(dest, filepath.Base(name))

	if err := os.MkdirAll(filepath.Dir(dstPath), 0755); err != nil {
		return err
	}

	dstFile, err := os.OpenFile(dstPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
	if err != nil {
		return err
	}
	defer dstFile.Close()

	srcFile, err := f.Open()
	if err != nil {
		return err
	}
	defer srcFile.Close()

	_, err = io.Copy(dstFile, srcFile)
	return err
}

func (i *Installer) Uninstall(name string) error {
	extDir := filepath.Join(getExtensionDir(), name)
	return os.RemoveAll(extDir)
}
