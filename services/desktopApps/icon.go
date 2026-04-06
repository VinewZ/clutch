package desktopapps

import (
	"bufio"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"
)

const (
	iconTargetSize = 48
	defaultTheme   = "hicolor"
)

type IconDir struct {
	Size int
	Type string
	Path string
}

type Theme struct {
	Name     string
	Inherits []string
	Dirs     []IconDir
}

type IconIndex struct {
	themes       map[string]Theme
	pixmaps      map[string]string // Direct icon files from pixmaps
	cache        map[string]string
	loaded       bool
	mu           sync.Mutex
	defaultTheme string
}

func NewIconIndex() *IconIndex {
	return &IconIndex{
		themes:  make(map[string]Theme),
		pixmaps: make(map[string]string),
		cache:   make(map[string]string),
	}
}

func (idx *IconIndex) LoadThemes() {
	idx.loadThemesAsync()
}

func (idx *IconIndex) loadThemesAsync() {
	start := time.Now()

	iconThemePaths := []string{
		filepath.Join(func() string { home, _ := os.UserHomeDir(); return home }(), ".local/share/icons"),
		"/usr/share/icons",
		"/var/lib/flatpak/exports/share/icons",
	}

	var loadedThemes int

	for _, baseDir := range iconThemePaths {
		entries, err := os.ReadDir(baseDir)
		if err != nil {
			continue
		}

		for _, entry := range entries {
			if !entry.IsDir() {
				continue
			}

			themePath := filepath.Join(baseDir, entry.Name())
			themeFile := filepath.Join(themePath, "index.theme")

			if _, err := os.Stat(themeFile); err != nil {
				continue
			}

			theme, err := idx.parseIndexTheme(themeFile)
			if err != nil {
				continue
			}

			// Don't overwrite existing theme (prefer first loaded, e.g., system over flatpak)
			if _, exists := idx.themes[theme.Name]; !exists {
				idx.themes[theme.Name] = theme
				loadedThemes++
			}
		}
	}

	// Also scan pixmaps directories for direct icon files
	pixmapPaths := []string{
		"/usr/share/pixmaps",
		filepath.Join(func() string { home, _ := os.UserHomeDir(); return home }(), ".local/share/pixmaps"),
		"/var/lib/flatpak/exports/share/icons/hicolor/scalable/apps",
	}

	// Also scan flatpak hicolor icon directories
	flatpakHicolorSizes := []string{"512x512", "256x256", "128x128", "96x96", "64x64", "48x48", "32x32", "16x16"}
	for _, size := range flatpakHicolorSizes {
		dirPath := filepath.Join("/var/lib/flatpak/exports/share/icons/hicolor", size, "apps")
		pixmapPaths = append(pixmapPaths, dirPath)
	}

	// Also scan non-standard icon directories (like 0x0)
	nonstandardPaths := []string{
		"/usr/share/icons/hicolor/0x0/apps",
	}
	for _, path := range nonstandardPaths {
		idx.scanIconDir(path)
	}

	for _, pixmapDir := range pixmapPaths {
		entries, err := os.ReadDir(pixmapDir)
		if err != nil {
			continue
		}

		for _, entry := range entries {
			if entry.IsDir() {
				continue
			}

			name := strings.ToLower(entry.Name())
			ext := strings.ToLower(filepath.Ext(name))
			if ext != ".svg" && ext != ".png" && ext != ".xpm" {
				continue
			}

			iconName := strings.TrimSuffix(name, ext)
			if _, exists := idx.pixmaps[iconName]; !exists {
				idx.pixmaps[iconName] = filepath.Join(pixmapDir, entry.Name())
			}
		}
	}

	// Also scan local hicolor icon directories (without index.theme)
	home, _ := os.UserHomeDir()
	hicolorSizes := []string{"512x512", "256x256", "128x128", "96x96", "64x64", "48x48", "32x32", "16x16"}
	hicolorContexts := []string{"apps", "devices", "mimetypes", "places", "categories", "actions", "status", "panel", "emblems", "emotes", "legacy", "ui"}

	// Scan user's local hicolor (largest sizes first to prefer larger icons)
	localHicolorBase := filepath.Join(home, ".local/share/icons/hicolor")
	for _, size := range hicolorSizes {
		for _, context := range hicolorContexts {
			dirPath := filepath.Join(localHicolorBase, size, context)
			idx.scanIconDir(dirPath)
		}
	}

	// Scan system hicolor apps and other contexts (largest sizes first)
	systemHicolorSizes := []string{"512x512", "256x256", "128x128", "96x96", "64x64", "48x48", "32x32", "16x16"}
	systemContexts := []string{"apps", "devices", "mimetypes", "places", "categories", "actions", "status", "panel", "emblems", "emotes", "legacy", "ui"}
	for _, size := range systemHicolorSizes {
		for _, context := range systemContexts {
			dirPath := filepath.Join("/usr/share/icons/hicolor", size, context)
			idx.scanIconDir(dirPath)
		}
	}

	// Scan AdwaitaLegacy directories (for legacy icons like network-wired)
	adwaitaLegacySizes := []string{"48x48", "32x32", "24x24", "22x22", "16x16"}
	adwaitaLegacyContexts := []string{"apps", "devices", "mimetypes", "places", "categories", "actions", "status", "legacy", "ui"}
	for _, size := range adwaitaLegacySizes {
		for _, context := range adwaitaLegacyContexts {
			dirPath := filepath.Join("/usr/share/icons/AdwaitaLegacy", size, context)
			idx.scanIconDir(dirPath)
		}
	}

	// Scan scalable directories (SVG icons)
	scalablePaths := []string{
		filepath.Join(home, ".local/share/icons/hicolor/scalable"),
		filepath.Join(home, ".local/share/icons/Fluent/scalable"),
		"/usr/share/icons/hicolor/scalable",
		"/usr/share/icons/Adwaita/scalable",
		"/usr/share/icons/AdwaitaLegacy/scalable",
	}
	for _, path := range scalablePaths {
		idx.scanIconDir(path)
	}

	// Also scan symbolic directories (monochrome icons)
	symbolicPaths := []string{
		filepath.Join(home, ".local/share/icons/hicolor/symbolic"),
		filepath.Join(home, ".local/share/icons/Fluent/symbolic"),
		"/usr/share/icons/hicolor/symbolic",
	}
	for _, path := range symbolicPaths {
		idx.scanIconDir(path)
	}

	// Scan additional icon directories
	additionalPaths := []string{
		"/usr/share/pixmaps",
		"/usr/share/uim/pixmaps",
		"/usr/share/gpsd/icons",
		filepath.Join(home, ".local/share/pixmaps"),
	}
	for _, dirPath := range additionalPaths {
		idx.scanIconDir(dirPath)
	}

	idx.loaded = true

	log.Printf("Icon theme scan completed in %v - %d themes loaded, %d pixmaps indexed", time.Since(start), loadedThemes, len(idx.pixmaps))
}

func (idx *IconIndex) parseIndexTheme(path string) (Theme, error) {
	file, err := os.Open(path)
	if err != nil {
		return Theme{}, err
	}
	defer file.Close()

	themeRootDir := filepath.Dir(path)
	themeName := filepath.Base(themeRootDir)

	theme := Theme{Name: themeName}
	dirs := make(map[string]IconDir)

	scanner := bufio.NewScanner(file)

	var inIconTheme bool
	var currentDir string
	var inDirSection bool

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		if line == "[Icon Theme]" {
			inIconTheme = true
			continue
		}

		if inIconTheme && strings.HasPrefix(line, "[") {
			currentDir = strings.Trim(line, "[]")
			inDirSection = currentDir != "Icon Theme"
			continue
		}

		if !inIconTheme {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])

		if inDirSection && currentDir != "" {
			switch key {
			case "Size":
				if size, err := strconv.Atoi(value); err == nil {
					dirs[currentDir] = IconDir{
						Size: size,
						Type: dirs[currentDir].Type,
						Path: filepath.Join(themeRootDir, currentDir),
					}
				}
			case "Type":
				dirs[currentDir] = IconDir{
					Size: dirs[currentDir].Size,
					Type: value,
					Path: filepath.Join(themeRootDir, currentDir),
				}
			}
		} else if key == "Inherits" {
			theme.Inherits = parseInherits(value)
		}
	}

	for _, dir := range dirs {
		theme.Dirs = append(theme.Dirs, dir)
	}

	return theme, nil
}

func parseInherits(value string) []string {
	if value == "" {
		return nil
	}

	var inherits []string
	for _, v := range strings.Split(value, ",") {
		v = strings.TrimSpace(v)
		if v != "" {
			inherits = append(inherits, v)
		}
	}
	return inherits
}

func (idx *IconIndex) Resolve(iconName string, targetSize int) string {
	if !idx.loaded {
		return fallbackIcon()
	}

	if iconName == "" {
		return fallbackIcon()
	}

	if strings.HasPrefix(iconName, "/") {
		if _, err := os.Stat(iconName); err == nil {
			return iconName
		}
		return fallbackIcon()
	}

	iconNameLower := strings.ToLower(iconName)

	// Check cache with mutex
	idx.mu.Lock()
	if cached, ok := idx.cache[iconNameLower]; ok {
		idx.mu.Unlock()
		return cached
	}
	idx.mu.Unlock()

	// Resolve through theme inheritance
	resolved := idx.resolveWithInheritance(iconNameLower, targetSize)

	// If not found in themes, check pixmaps
	if resolved == "" {
		if pixmapPath, ok := idx.pixmaps[iconNameLower]; ok {
			// Skip .xpm files - can't be rendered in HTML img tags
			if !strings.HasSuffix(pixmapPath, ".xpm") {
				resolved = pixmapPath
			}
		}
	}

	// Cache result with mutex
	idx.mu.Lock()
	if resolved != "" {
		idx.cache[iconNameLower] = resolved
	} else {
		idx.cache[iconNameLower] = fallbackIcon()
	}
	idx.mu.Unlock()

	if resolved != "" {
		return resolved
	}

	return fallbackIcon()
}

func (idx *IconIndex) resolveWithInheritance(iconName string, targetSize int) string {
	visited := make(map[string]bool)
	return idx.walkInheritance(iconName, targetSize, defaultTheme, visited)
}

func (idx *IconIndex) walkInheritance(iconName string, targetSize int, themeName string, visited map[string]bool) string {
	if visited[themeName] {
		return ""
	}
	visited[themeName] = true

	theme, ok := idx.themes[themeName]
	if !ok {
		return ""
	}

	// Try to find icon in this theme
	if path := idx.findBestIcon(iconName, targetSize, theme); path != "" {
		return path
	}

	// Walk inherited themes
	for _, inheritName := range theme.Inherits {
		if path := idx.walkInheritance(iconName, targetSize, inheritName, visited); path != "" {
			return path
		}
	}

	return ""
}

func (idx *IconIndex) findBestIcon(iconName string, targetSize int, theme Theme) string {
	// Priority 1: Check scalable directories first (Vector/Scaled icons are best - resolution independent)
	scalableChecked := 0
	for _, dir := range theme.Dirs {
		isVector := dir.Type == "Vector" || dir.Type == "Scaled" || dir.Type == "Scalable" || dir.Type == ""
		if isVector {
			scalableChecked++
			if path := idx.iconExistsInDir(iconName, dir.Path); path != "" {
				return path
			}
		}
	}

	// Priority 2: Find Fixed/Threshold at exact target size
	for _, dir := range theme.Dirs {
		isVector := dir.Type == "Vector" || dir.Type == "Scaled" || dir.Type == "Scalable" || dir.Type == ""
		if !isVector && dir.Size == targetSize {
			if path := idx.iconExistsInDir(iconName, dir.Path); path != "" {
				return path
			}
		}
	}

	// Priority 3: Find closest Fixed/Threshold size (prefer larger over smaller)
	var closestMatch string
	var closestDiff int = -1

	for _, dir := range theme.Dirs {
		isVector := dir.Type == "Vector" || dir.Type == "Scaled" || dir.Type == "Scalable" || dir.Type == ""
		if !isVector {
			if path := idx.iconExistsInDir(iconName, dir.Path); path != "" {
				sizeDiff := dir.Size - targetSize
				if sizeDiff < 0 {
					sizeDiff = -sizeDiff
				}
				// Prefer larger icons over smaller ones (less blurry when scaled down)
				if closestMatch == "" || dir.Size > targetSize && closestDiff > sizeDiff {
					closestMatch = path
					closestDiff = sizeDiff
				}
			}
		}
	}

	return closestMatch
}

func (idx *IconIndex) iconExistsInDir(iconName, dirPath string) string {
	// Check if directory exists
	if _, err := os.Stat(dirPath); err != nil {
		return ""
	}

	// Try common extensions
	for _, ext := range []string{".svg", ".png"} {
		iconPath := filepath.Join(dirPath, iconName+ext)
		if _, err := os.Stat(iconPath); err == nil {
			return iconPath
		}
	}

	// Scan directory for matching name (case-insensitive)
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return ""
	}

	iconNameLower := iconName + ".png"
	iconNameSvg := iconName + ".svg"

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		nameLower := strings.ToLower(entry.Name())
		if nameLower == iconNameLower || nameLower == iconNameSvg {
			return filepath.Join(dirPath, entry.Name())
		}

		// Also check name without extension
		baseName := strings.TrimSuffix(nameLower, filepath.Ext(nameLower))
		if baseName == iconName {
			return filepath.Join(dirPath, entry.Name())
		}
	}

	return ""
}

func (idx *IconIndex) scanIconDir(dirPath string) {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		name := strings.ToLower(entry.Name())
		ext := strings.ToLower(filepath.Ext(name))
		if ext != ".svg" && ext != ".png" && ext != ".xpm" {
			continue
		}

		iconName := strings.TrimSuffix(name, ext)
		if _, exists := idx.pixmaps[iconName]; !exists {
			idx.pixmaps[iconName] = filepath.Join(dirPath, entry.Name())
		}
	}
}

func fallbackIcon() string {
	fallbacks := []string{
		"/usr/share/icons/hicolor/48x48/mimetypes/application-x-desktop.png",
		"/usr/share/icons/hicolor/48x48/apps/utilities-terminal.png",
		"/usr/share/icons/AdwaitaLegacy/48x48/legacy/utilities-terminal.png",
		"/usr/share/icons/breeze/apps/22/utilities-terminal.svg",
	}

	for _, path := range fallbacks {
		if _, err := os.Stat(path); err == nil {
			return path
		}
	}

	return ""
}
