package app

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

type githubFile struct {
	Owner       string `json:"owner"`
	Repo        string `json:"repo"`
	Name        string `json:"name"`
	Sha         string `json:"sha"`
	DownloadURL string `json:"download_url"`
	Type        string `json:"type"`
	Links       struct {
		Self string `json:"self"`
	} `json:"_links"`
}

type githubDir struct {
	Files []githubFile
}

func (s *ClutchServices) DownloadExtension(url string) error {
	if url == "" {
		return fmt.Errorf("URL is empty")
	}

	parts := strings.Split(url, "/")
	if len(parts) < 5 {
		return fmt.Errorf("Invalid URL: %s\n Expected format: https://github.com/OWNER/REPO ", url)
	}

	owner := parts[3]
	repo := parts[4]

	pkgJson := &githubFile{}
	if err := pkgJson.fetchFile(owner, repo, "package.json"); err != nil {
		log.Fatalf("Error fetching package.json: %v", err)
	}

	ghRootDir := "dist"
	dist := &githubDir{}
	if err := dist.fetchDir(pkgJson.Owner, pkgJson.Repo, ghRootDir); err != nil {
		ghRootDir = "build"
	}

	extensionDir := filepath.Join(os.Getenv("HOME"), ".config", "clutch", "extensions", pkgJson.Repo)

	if err := downloadGithubPath(pkgJson.Owner, pkgJson.Repo, ghRootDir, extensionDir); err != nil {
		return fmt.Errorf("Error download %s tree: %s", ghRootDir, err.Error())
	}

	return nil
}

func (e *githubFile) fetchFile(owner, repo, path string) error {
	if owner == "" || repo == "" || path == "" {
		return fmt.Errorf("Owner, Repo and Path must be set")
	}

	e.Owner = owner
	e.Repo = repo

	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/contents/%s", owner, repo, path)
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	return json.Unmarshal(body, e)
}

func (d *githubDir) fetchDir(owner, repo, path string) error {
	if owner == "" || repo == "" || path == "" {
		return fmt.Errorf("Owner, Repo and Path must be set")
	}

	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/contents/%s", owner, repo, path)
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	var items []githubFile
	if err := json.Unmarshal(body, &items); err != nil {
		return err
	}

	for i := range items {
		items[i].Owner = owner
		items[i].Repo = repo
	}
	d.Files = items
	return nil
}

func (e *githubFile) downloadFile(outDir string) error {
	if e.DownloadURL == "" {
		return fmt.Errorf("download URL is empty for %s", e.Name)
	}
	resp, err := http.Get(e.DownloadURL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	outPath := filepath.Join(outDir, e.Name)
	out, err := os.Create(outPath)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, resp.Body)
	return err
}

func downloadGithubPath(owner, repo, remotePath, localPath string) error {
	var dir githubDir
	if err := dir.fetchDir(owner, repo, remotePath); err != nil {
		return fmt.Errorf("Directory doesn't exist, is private or malformed: %s", err)
	}

	for _, file := range dir.Files {
		switch file.Type {
		case "dir":
			subLocal := filepath.Join(localPath, file.Name)
			if err := os.MkdirAll(subLocal, os.ModePerm); err != nil {
				log.Printf("mkdir %s: %v", subLocal, err)
				continue
			}
			subRemote := filepath.Join(remotePath, file.Name)
			if err := downloadGithubPath(owner, repo, subRemote, subLocal); err != nil {
				log.Printf("recursing %s: %v", subRemote, err)
			}

		case "file":
			if err := file.downloadFile(localPath); err != nil {
				log.Printf("download %s: %v", file.Name, err)
			}

		default:
			log.Printf("skipping unknown type %s for %s", file.Type, file.Name)
		}
	}

	return nil
}
