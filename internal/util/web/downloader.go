package web

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"time"

	"onwapp/internal/validator"
)

const (
	maxDownloadSize = 100 * 1024 * 1024
	downloadTimeout = 30 * time.Second
)

func DownloadFromURL(url string) ([]byte, string, error) {
	if err := validator.ValidateURL(url); err != nil {
		return nil, "", err
	}

	client := &http.Client{
		Timeout: downloadTimeout,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if err := validator.ValidateURL(req.URL.String()); err != nil {
				return err
			}
			if len(via) >= 5 {
				return http.ErrUseLastResponse
			}
			return nil
		},
	}

	ctx, cancel := context.WithTimeout(context.Background(), downloadTimeout)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("User-Agent", "OnWapp/1.0")

	resp, err := client.Do(req)
	if err != nil {
		return nil, "", fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, "", fmt.Errorf("failed to download: status %s", resp.Status)
	}

	limitedReader := io.LimitReader(resp.Body, maxDownloadSize+1)
	data, err := io.ReadAll(limitedReader)
	if err != nil {
		return nil, "", fmt.Errorf("failed to read body: %w", err)
	}

	if int64(len(data)) > maxDownloadSize {
		return nil, "", fmt.Errorf("file size exceeds 100MB limit")
	}

	mimeType := resp.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = http.DetectContentType(data)
	}

	return data, mimeType, nil
}
