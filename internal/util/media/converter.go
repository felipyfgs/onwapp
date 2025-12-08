package media

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

// ConvertWebMToOgg converts WebM audio to OGG Opus format using FFmpeg
// This is required because WhatsApp only supports OGG Opus for voice messages (PTT)
func ConvertWebMToOgg(webmData []byte) ([]byte, error) {
	// Create temp files
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

	// Write input data
	if _, err := inputFile.Write(webmData); err != nil {
		return nil, fmt.Errorf("failed to write webm data: %w", err)
	}
	inputFile.Close()

	// Run FFmpeg conversion
	// -y: overwrite output
	// -i: input file
	// -c:a libopus: use Opus codec
	// -b:a 64k: bitrate 64kbps (good for voice)
	// -ar 48000: sample rate 48kHz (Opus standard)
	// -ac 1: mono audio (better for voice)
	// -application voip: optimize for voice
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

	// Read output file
	outputData, err := os.ReadFile(outputFile.Name())
	if err != nil {
		return nil, fmt.Errorf("failed to read converted file: %w", err)
	}

	return outputData, nil
}

// IsWebMFormat checks if the audio data or MIME type indicates WebM format
func IsWebMFormat(data []byte, mimeType string) bool {
	// Check MIME type
	if strings.Contains(strings.ToLower(mimeType), "webm") {
		return true
	}

	// Check magic bytes for WebM (EBML header)
	// WebM files start with: 0x1A 0x45 0xDF 0xA3
	if len(data) >= 4 {
		if data[0] == 0x1A && data[1] == 0x45 && data[2] == 0xDF && data[3] == 0xA3 {
			return true
		}
	}

	return false
}
