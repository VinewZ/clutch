package store

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"
)

const (
	apiBaseURL = "https://backend.raycast.com/api/v1/store_listings"
	cacheTTL   = 5 * time.Minute
)

type APIClient struct {
	client     *http.Client
	cache      []Extension
	cacheTime  time.Time
	cacheMutex sync.RWMutex
}

func NewAPIClient() *APIClient {
	return &APIClient{
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *APIClient) FetchExtensions() ([]Extension, error) {
	c.cacheMutex.RLock()
	if c.cache != nil && time.Since(c.cacheTime) < cacheTTL {
		defer c.cacheMutex.RUnlock()
		return c.cache, nil
	}
	c.cacheMutex.RUnlock()

	resp, err := c.client.Get(apiBaseURL + "?page=1&per_page=50")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var apiResp apiResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, err
	}

	extensions := make([]Extension, len(apiResp.Data))
	for i, apiExt := range apiResp.Data {
		extensions[i] = apiExt.toExtension()
	}

	c.cacheMutex.Lock()
	c.cache = extensions
	c.cacheTime = time.Now()
	c.cacheMutex.Unlock()

	return extensions, nil
}

func (c *APIClient) SearchExtensions(query string) ([]Extension, error) {
	extensions, err := c.FetchExtensions()
	if err != nil {
		return nil, err
	}

	if query == "" {
		return extensions, nil
	}

	var results []Extension
	for _, ext := range extensions {
		if matchesQuery(ext, query) {
			results = append(results, ext)
		}
	}

	return results, nil
}

func matchesQuery(ext Extension, query string) bool {
	queryLower := lower(query)

	if containsLower(ext.Name, queryLower) {
		return true
	}
	if containsLower(ext.Title, queryLower) {
		return true
	}
	if containsLower(ext.Description, queryLower) {
		return true
	}
	if containsLower(ext.Author.Name, queryLower) {
		return true
	}
	for _, cat := range ext.Categories {
		if containsLower(cat, queryLower) {
			return true
		}
	}
	return false
}

func lower(s string) string {
	result := make([]byte, len(s))
	for i, c := range s {
		if c >= 'A' && c <= 'Z' {
			result[i] = byte(c + 32)
		} else {
			result[i] = byte(c)
		}
	}
	return string(result)
}

func containsLower(s, substr string) bool {
	sLower := lower(s)
	substrLower := lower(substr)

	for i := 0; i <= len(sLower)-len(substrLower); i++ {
		if sLower[i:i+len(substrLower)] == substrLower {
			return true
		}
	}
	return false
}
