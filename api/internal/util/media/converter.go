package media

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

func ConvertWebMToOgg(webmData []byte) ([]byte, error) {
	inputFile, err := os.CreateTemp("", "audio_input_*.webm")
	if err != nil {
		return nil, fmt.Errorf("failed to create temp input file: %w", err)
	}
	defer os.Remove(inputFile.Name())

	outputFile, err := os.CreateTemp("", "audio_output_*.ogg")
	if err != nil {
		return nil, fmt.Errorf("failed to create temp output file: %w", err)
	}
	defer os.Remove(outputFile.Name())

	if _, err := inputFile.Write(webmData); err != nil {
		return nil, fmt.Errorf("failed to write webm data: %w", err)
	}
	inputFile.Close()

	cmd := exec.Command("ffmpeg",
		"-y",
		"-i", inputFile.Name(),
		"-c:a", "libopus",
		"-b:a", "64k",
		"-ar", "48000",
		"-ac", "1",
		"-application", "voip",
		outputFile.Name(),
	)

	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("ffmpeg conversion failed: %w, stderr: %s", err, stderr.String())
	}

	outputData, err := os.ReadFile(outputFile.Name())
	if err != nil {
		return nil, fmt.Errorf("failed to read converted file: %w", err)
	}

	return outputData, nil
}

func IsWebMFormat(data []byte, mimeType string) bool {
	if strings.Contains(strings.ToLower(mimeType), "webm") {
		return true
	}

	if len(data) >= 4 {
		if data[0] == 0x1A && data[1] == 0x45 && data[2] == 0xDF && data[3] == 0xA3 {
			return true
		}
	}

	return false
}
