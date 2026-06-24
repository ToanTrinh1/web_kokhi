package notify

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

const apiURL = "https://api.telegram.org/bot%s/sendMessage"

type Client struct {
	Token string
	HTTP  *http.Client
}

func NewClient(token string) *Client {
	return &Client{
		Token: strings.TrimSpace(token),
		HTTP:  &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *Client) Enabled() bool {
	return c != nil && c.Token != ""
}

func (c *Client) Send(chatID, text string) error {
	if !c.Enabled() {
		return fmt.Errorf("telegram bot token not configured")
	}
	chatID = strings.TrimSpace(chatID)
	if chatID == "" {
		return fmt.Errorf("telegram chat_id not configured")
	}

	body, _ := json.Marshal(map[string]string{
		"chat_id": chatID,
		"text":    text,
	})
	url := fmt.Sprintf(apiURL, c.Token)
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	res, err := c.HTTP.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= 300 {
		var errResp struct {
			Description string `json:"description"`
		}
		_ = json.NewDecoder(res.Body).Decode(&errResp)
		if errResp.Description != "" {
			return fmt.Errorf("telegram: %s", errResp.Description)
		}
		return fmt.Errorf("telegram: HTTP %d", res.StatusCode)
	}
	return nil
}

func FormatAlert(stationName, level, message string) string {
	icon := "⚠️"
	if level == "critical" {
		icon = "🚨"
	}
	return fmt.Sprintf("%s %s\n%s", icon, stationName, message)
}

func FormatForecast(stationName, message string) string {
	return fmt.Sprintf("📈 Dự báo — %s\n%s", stationName, message)
}
