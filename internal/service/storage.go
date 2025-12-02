package service

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"path"
	"strings"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"

	"zpwoot/internal/config"
	"zpwoot/internal/logger"
)

type StorageService struct {
	client    *minio.Client
	bucket    string
	endpoint  string
	useSSL    bool
	publicURL string
}

type UploadResult struct {
	Key         string
	URL         string
	Size        int64
	ContentType string
}

func NewStorageService(cfg *config.Config) (*StorageService, error) {
	client, err := minio.New(cfg.MinioEndpoint, &minio.Options{
		Creds:        credentials.NewStaticV4(cfg.MinioAccessKey, cfg.MinioSecretKey, ""),
		Secure:       cfg.MinioUseSSL,
		BucketLookup: minio.BucketLookupPath, // Force path-style access for reverse proxy compatibility
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create minio client: %w", err)
	}

	s := &StorageService{
		client:   client,
		bucket:   cfg.MinioBucket,
		endpoint: cfg.MinioEndpoint,
		useSSL:   cfg.MinioUseSSL,
	}

	// Build public URL
	if cfg.MinioPublicURL != "" {
		// Use explicit public URL if provided
		s.publicURL = fmt.Sprintf("%s/%s", strings.TrimSuffix(cfg.MinioPublicURL, "/"), cfg.MinioBucket)
	} else {
		// Default: build from endpoint
		protocol := "http"
		if cfg.MinioUseSSL {
			protocol = "https"
		}
		s.publicURL = fmt.Sprintf("%s://%s/%s", protocol, cfg.MinioEndpoint, cfg.MinioBucket)
	}

	return s, nil
}

func (s *StorageService) EnsureBucket(ctx context.Context) error {
	const maxRetries = 5
	var lastErr error

	for attempt := 1; attempt <= maxRetries; attempt++ {
		err := s.ensureBucketOnce(ctx)
		if err == nil {
			return nil
		}
		lastErr = err
		if attempt < maxRetries {
			backoff := time.Duration(attempt) * 2 * time.Second
			logger.Warn().
				Err(err).
				Int("attempt", attempt).
				Int("maxRetries", maxRetries).
				Dur("backoff", backoff).
				Msg("Failed to ensure bucket, retrying...")
			time.Sleep(backoff)
		}
	}

	return lastErr
}

func (s *StorageService) ensureBucketOnce(ctx context.Context) error {
	logger.Debug().
		Str("endpoint", s.endpoint).
		Str("bucket", s.bucket).
		Bool("useSSL", s.useSSL).
		Msg("Checking bucket existence")

	exists, err := s.client.BucketExists(ctx, s.bucket)
	if err != nil {
		logger.Error().Err(err).Str("bucket", s.bucket).Msg("BucketExists check failed")
		return fmt.Errorf("failed to check bucket existence: %w", err)
	}

	logger.Debug().Bool("exists", exists).Str("bucket", s.bucket).Msg("Bucket existence check result")

	if !exists {
		logger.Info().Str("bucket", s.bucket).Msg("Bucket does not exist, creating...")
		err = s.client.MakeBucket(ctx, s.bucket, minio.MakeBucketOptions{})
		if err != nil {
			logger.Error().Err(err).Str("bucket", s.bucket).Msg("MakeBucket failed")
			// Check if bucket was created by another process
			exists, checkErr := s.client.BucketExists(ctx, s.bucket)
			if checkErr == nil && exists {
				logger.Info().Str("bucket", s.bucket).Msg("Bucket already exists (created by another process)")
			} else {
				return fmt.Errorf("failed to create bucket: %w", err)
			}
		} else {
			logger.Info().Str("bucket", s.bucket).Msg("Created MinIO bucket")
		}

		// Set bucket policy to allow public read
		policy := fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {"AWS": ["*"]},
					"Action": ["s3:GetObject"],
					"Resource": ["arn:aws:s3:::%s/*"]
				}
			]
		}`, s.bucket)

		err = s.client.SetBucketPolicy(ctx, s.bucket, policy)
		if err != nil {
			logger.Warn().Err(err).Msg("Failed to set bucket policy (bucket may not be public)")
		}
	}

	return nil
}

func (s *StorageService) Upload(ctx context.Context, sessionID, msgID, mediaType string, fromMe bool, data []byte, contentType string) (*UploadResult, error) {
	if len(data) == 0 {
		return nil, fmt.Errorf("empty data")
	}

	// Generate key: session/direction/date/msgid_type.ext
	ext := getExtensionFromContentType(contentType)
	date := time.Now().Format("2006/01/02")
	direction := "received"
	if fromMe {
		direction = "sent"
	}
	key := fmt.Sprintf("%s/%s/%s/%s_%s%s", sessionID, direction, date, msgID, mediaType, ext)

	reader := bytes.NewReader(data)
	info, err := s.client.PutObject(ctx, s.bucket, key, reader, int64(len(data)), minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to upload to minio: %w", err)
	}

	url := fmt.Sprintf("%s/%s", s.publicURL, key)

	logger.Debug().
		Str("key", key).
		Int64("size", info.Size).
		Str("contentType", contentType).
		Msg("Uploaded media to MinIO")

	return &UploadResult{
		Key:         key,
		URL:         url,
		Size:        info.Size,
		ContentType: contentType,
	}, nil
}

func (s *StorageService) Download(ctx context.Context, key string) ([]byte, error) {
	obj, err := s.client.GetObject(ctx, s.bucket, key, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get object: %w", err)
	}
	defer obj.Close()

	data, err := io.ReadAll(obj)
	if err != nil {
		return nil, fmt.Errorf("failed to read object: %w", err)
	}

	return data, nil
}

func (s *StorageService) Delete(ctx context.Context, key string) error {
	err := s.client.RemoveObject(ctx, s.bucket, key, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete object: %w", err)
	}
	return nil
}

func (s *StorageService) GetURL(key string) string {
	return fmt.Sprintf("%s/%s", s.publicURL, key)
}

func (s *StorageService) GetPresignedURL(ctx context.Context, key string, expiry time.Duration) (string, error) {
	url, err := s.client.PresignedGetObject(ctx, s.bucket, key, expiry, nil)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}
	return url.String(), nil
}

func getExtensionFromContentType(contentType string) string {
	switch {
	case strings.HasPrefix(contentType, "image/jpeg"):
		return ".jpg"
	case strings.HasPrefix(contentType, "image/png"):
		return ".png"
	case strings.HasPrefix(contentType, "image/gif"):
		return ".gif"
	case strings.HasPrefix(contentType, "image/webp"):
		return ".webp"
	case strings.HasPrefix(contentType, "video/mp4"):
		return ".mp4"
	case strings.HasPrefix(contentType, "video/3gpp"):
		return ".3gp"
	case strings.HasPrefix(contentType, "audio/ogg"):
		return ".ogg"
	case strings.HasPrefix(contentType, "audio/mpeg"):
		return ".mp3"
	case strings.HasPrefix(contentType, "audio/aac"):
		return ".aac"
	case strings.HasPrefix(contentType, "application/pdf"):
		return ".pdf"
	case strings.HasPrefix(contentType, "application/"):
		return path.Ext(contentType)
	default:
		return ""
	}
}
