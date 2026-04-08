package currency

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/charmbracelet/log"
)

const (
	FRANKFURTER_API = "https://api.frankfurter.dev/v1"
	CACHE_TTL       = 24 * time.Hour
)

type RateCache struct {
	Base       string             `json:"base"`
	Updated    time.Time          `json:"updated"`
	Currencies map[string]string  `json:"currencies"`
	Rates      map[string]float64 `json:"rates"`
}

type CurrencyService struct {
	mu       sync.RWMutex
	cache    RateCache
	filePath string
}

func NewCurrencyService() *CurrencyService {
	dir := filepath.Join(os.Getenv("HOME"), ".local", "share", "clutch")
	os.MkdirAll(dir, 0755)

	cs := &CurrencyService{
		filePath: filepath.Join(dir, "rates.json"),
		cache: RateCache{
			Currencies: make(map[string]string),
			Rates:      make(map[string]float64),
		},
	}

	cs.load()
	cs.refreshIfNeeded()

	return cs
}

func (cs *CurrencyService) load() error {
	cs.mu.Lock()
	defer cs.mu.Unlock()

	data, err := os.ReadFile(cs.filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	return json.Unmarshal(data, &cs.cache)
}

func (cs *CurrencyService) save() error {
	data, err := json.MarshalIndent(cs.cache, "", " ")
	if err != nil {
		return err
	}

	return os.WriteFile(cs.filePath, data, 0644)
}

func (cs *CurrencyService) NeedsRefresh() bool {
	cs.mu.RLock()
	defer cs.mu.RUnlock()

	return time.Since(cs.cache.Updated) > CACHE_TTL || len(cs.cache.Rates) == 0
}

func (cs *CurrencyService) refreshIfNeeded() {
	if cs.NeedsRefresh() {
		if err := cs.Refresh(); err != nil {
			log.Error("Failed to refresh currency rates", "error", err)
		}
	}
}

func (cs *CurrencyService) Refresh() error {
	log.Info("Refreshing currency rates...")

	currencies, err := cs.fetchCurrencies()
	if err != nil {
		log.Error("Failed to fetch currencies", "error", err)
		return err
	}

	rates, err := cs.fetchRates()
	if err != nil {
		log.Error("Failed to fetch rates", "error", err)
		return err
	}

	cs.mu.Lock()
	defer cs.mu.Unlock()

	cs.cache.Base = "EUR"
	cs.cache.Updated = time.Now()
	cs.cache.Currencies = currencies
	cs.cache.Rates = rates

	if err := cs.save(); err != nil {
		log.Error("Failed to save currency cache", "error", err)
		return err
	}

	log.Info("Currency rates refreshed successfully")
	return nil
}

func (cs *CurrencyService) fetchCurrencies() (map[string]string, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(FRANKFURTER_API + "/currencies")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch currencies: status %d", resp.StatusCode)
	}

	var currencies map[string]string
	if err := json.NewDecoder(resp.Body).Decode(&currencies); err != nil {
		return nil, err
	}

	return currencies, nil
}

func (cs *CurrencyService) fetchRates() (map[string]float64, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(FRANKFURTER_API + "/latest?from=EUR")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch rates: status %d", resp.StatusCode)
	}

	var data struct {
		Rates map[string]float64 `json:"rates"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	data.Rates["EUR"] = 1.0

	return data.Rates, nil
}

func (cs *CurrencyService) GetCurrencies() map[string]string {
	cs.mu.RLock()
	defer cs.mu.RUnlock()

	result := make(map[string]string)
	for k, v := range cs.cache.Currencies {
		result[k] = v
	}
	return result
}

func (cs *CurrencyService) GetRates() map[string]float64 {
	cs.mu.RLock()
	defer cs.mu.RUnlock()

	result := make(map[string]float64)
	for k, v := range cs.cache.Rates {
		result[k] = v
	}
	return result
}

func (cs *CurrencyService) GetLastUpdated() time.Time {
	cs.mu.RLock()
	defer cs.mu.RUnlock()

	return cs.cache.Updated
}

type ConversionResult struct {
	From      string  `json:"from"`
	To        string  `json:"to"`
	FromName  string  `json:"fromName"`
	ToName    string  `json:"toName"`
	Amount    float64 `json:"amount"`
	Result    float64 `json:"result"`
	Rate      float64 `json:"rate"`
	Timestamp string  `json:"timestamp"`
}

func (cs *CurrencyService) Convert(amount float64, from string, to string) (*ConversionResult, error) {
	cs.mu.RLock()
	defer cs.mu.RUnlock()

	from = normalizeCurrency(from)
	to = normalizeCurrency(to)

	fromRate, ok := cs.cache.Rates[from]
	if !ok {
		return nil, &CurrencyError{Code: "INVALID_FROM", Message: "Unknown currency: " + from}
	}

	toRate, ok := cs.cache.Rates[to]
	if !ok {
		return nil, &CurrencyError{Code: "INVALID_TO", Message: "Unknown currency: " + to}
	}

	result := amount * (toRate / fromRate)
	rate := toRate / fromRate

	return &ConversionResult{
		From:      from,
		To:        to,
		FromName:  cs.cache.Currencies[from],
		ToName:    cs.cache.Currencies[to],
		Amount:    amount,
		Result:    result,
		Rate:      rate,
		Timestamp: cs.cache.Updated.Format(time.RFC3339),
	}, nil
}

func normalizeCurrency(code string) string {
	if len(code) == 3 {
		return code
	}
	return code
}

type CurrencyError struct {
	Code    string
	Message string
}

func (e *CurrencyError) Error() string {
	return e.Message
}
