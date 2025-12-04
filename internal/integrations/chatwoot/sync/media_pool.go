package sync

import (
	"context"
	"sync"
	"time"

	"golang.org/x/time/rate"

	"zpwoot/internal/integrations/chatwoot/client"
	"zpwoot/internal/integrations/chatwoot/core"
	"zpwoot/internal/logger"
	"zpwoot/internal/model"
)

// MediaUploadJob represents a single media upload task
type MediaUploadJob struct {
	Msg            *model.Message
	Media          *model.Media
	ConversationID int
	SenderPrefix   string
	SourceID       string
}

// MediaUploadResult represents the result of a media upload
type MediaUploadResult struct {
	SourceID  string
	CwMsgID   int
	ConvID    int
	Timestamp time.Time
	Success   bool
	Error     error
}

// MediaWorkerPool manages concurrent media uploads with rate limiting
type MediaWorkerPool struct {
	client      *client.Client
	workers     int
	rateLimiter *rate.Limiter
	wg          sync.WaitGroup
}

// NewMediaWorkerPool creates a new media worker pool
func NewMediaWorkerPool(cli *client.Client, workers int, ratePerSecond float64) *MediaWorkerPool {
	if workers <= 0 {
		workers = core.MediaWorkers
	}
	if ratePerSecond <= 0 {
		ratePerSecond = core.MediaRatePerSecond
	}

	return &MediaWorkerPool{
		client:      cli,
		workers:     workers,
		rateLimiter: rate.NewLimiter(rate.Limit(ratePerSecond), workers),
	}
}

// ProcessBatch processes multiple media uploads concurrently
func (p *MediaWorkerPool) ProcessBatch(ctx context.Context, jobs []MediaUploadJob) []MediaUploadResult {
	if len(jobs) == 0 {
		return nil
	}

	results := make([]MediaUploadResult, len(jobs))
	jobsCh := make(chan indexedJob, len(jobs))
	resultsCh := make(chan indexedResult, len(jobs))

	// Start workers
	for i := 0; i < p.workers; i++ {
		p.wg.Add(1)
		go p.worker(ctx, jobsCh, resultsCh)
	}

	// Send jobs
	go func() {
		for i, job := range jobs {
			select {
			case <-ctx.Done():
				return
			case jobsCh <- indexedJob{index: i, job: job}:
			}
		}
		close(jobsCh)
	}()

	// Collect results
	go func() {
		p.wg.Wait()
		close(resultsCh)
	}()

	for r := range resultsCh {
		results[r.index] = r.result
	}

	return results
}

type indexedJob struct {
	index int
	job   MediaUploadJob
}

type indexedResult struct {
	index  int
	result MediaUploadResult
}

func (p *MediaWorkerPool) worker(ctx context.Context, jobs <-chan indexedJob, results chan<- indexedResult) {
	defer p.wg.Done()

	uploader := client.NewMediaUploader(p.client)

	for ij := range jobs {
		select {
		case <-ctx.Done():
			results <- indexedResult{
				index: ij.index,
				result: MediaUploadResult{
					SourceID: ij.job.SourceID,
					Success:  false,
					Error:    ctx.Err(),
				},
			}
			continue
		default:
		}

		// Wait for rate limiter
		if err := p.rateLimiter.Wait(ctx); err != nil {
			results <- indexedResult{
				index: ij.index,
				result: MediaUploadResult{
					SourceID: ij.job.SourceID,
					Success:  false,
					Error:    err,
				},
			}
			continue
		}

		result := p.processJob(ctx, uploader, ij.job)
		results <- indexedResult{index: ij.index, result: result}
	}
}

func (p *MediaWorkerPool) processJob(ctx context.Context, uploader *client.MediaUploader, job MediaUploadJob) MediaUploadResult {
	result := MediaUploadResult{
		SourceID:  job.SourceID,
		ConvID:    job.ConversationID,
		Timestamp: job.Msg.Timestamp,
	}

	messageType := core.MessageTypeIncoming
	if job.Msg.FromMe {
		messageType = core.MessageTypeOutgoing
	}

	caption := job.Msg.Content
	if job.SenderPrefix != "" {
		caption = job.SenderPrefix + caption
	}

	cwMsg, err := uploader.UploadFromURL(ctx, client.MediaUploadRequest{
		ConversationID: job.ConversationID,
		MediaURL:       job.Media.StorageURL,
		MediaType:      job.Media.MediaType,
		Filename:       job.Media.FileName,
		MimeType:       job.Media.MimeType,
		Caption:        caption,
		MessageType:    messageType,
		SourceID:       job.SourceID,
	})

	if err != nil {
		logger.Debug().Err(err).Str("sourceId", job.SourceID).Msg("Chatwoot sync: media upload failed")
		result.Error = err
		return result
	}

	if cwMsg != nil && cwMsg.ID > 0 {
		result.CwMsgID = cwMsg.ID
		result.Success = true
	}

	return result
}

// MediaBatchCollector collects media jobs for batch processing
type MediaBatchCollector struct {
	jobs       []MediaUploadJob
	mediaInfos map[string]*model.Media
	mu         sync.Mutex
}

// NewMediaBatchCollector creates a new collector
func NewMediaBatchCollector() *MediaBatchCollector {
	return &MediaBatchCollector{
		jobs:       make([]MediaUploadJob, 0, 100),
		mediaInfos: make(map[string]*model.Media),
	}
}

// SetMediaInfos sets prefetched media info
func (c *MediaBatchCollector) SetMediaInfos(infos map[string]*model.Media) {
	c.mu.Lock()
	c.mediaInfos = infos
	c.mu.Unlock()
}

// Add adds a job to the collector
func (c *MediaBatchCollector) Add(job MediaUploadJob) {
	c.mu.Lock()
	c.jobs = append(c.jobs, job)
	c.mu.Unlock()
}

// GetJobs returns all collected jobs and clears the collector
func (c *MediaBatchCollector) GetJobs() []MediaUploadJob {
	c.mu.Lock()
	jobs := c.jobs
	c.jobs = make([]MediaUploadJob, 0, 100)
	c.mu.Unlock()
	return jobs
}

// GetMediaInfo returns media info for a message ID
func (c *MediaBatchCollector) GetMediaInfo(msgID string) *model.Media {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.mediaInfos[msgID]
}

// Count returns the number of jobs
func (c *MediaBatchCollector) Count() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return len(c.jobs)
}
