package sync

import (
	"context"
	"database/sql"
	"fmt"
	gosync "sync"
	"time"

	"zpwoot/internal/integrations/chatwoot/client"
	"zpwoot/internal/integrations/chatwoot/core"
	"zpwoot/internal/logger"
)

const (
	avatarWorkerCount    = 5
	avatarRequestTimeout = 5 * time.Second
)

// AvatarUpdater handles avatar update operations
type AvatarUpdater struct {
	cfg            *core.Config
	client         *client.Client
	contactsGetter ContactsGetter
}

// NewAvatarUpdater creates a new avatar updater
func NewAvatarUpdater(cfg *core.Config, cli *client.Client, contactsGetter ContactsGetter) *AvatarUpdater {
	return &AvatarUpdater{
		cfg:            cfg,
		client:         cli,
		contactsGetter: contactsGetter,
	}
}

// UpdateAvatars updates avatars for contacts in chatCache
func (u *AvatarUpdater) UpdateAvatars(ctx context.Context, chatCache map[string]*core.ChatFKs) int {
	if u.contactsGetter == nil || len(chatCache) == 0 {
		return 0
	}

	updated := 0
	for jid, fks := range chatCache {
		if fks == nil {
			continue
		}

		if u.updateSingleAvatar(ctx, jid, fks.ContactID) {
			updated++
		}
	}
	return updated
}

// updateSingleAvatar updates avatar for a single contact
func (u *AvatarUpdater) updateSingleAvatar(ctx context.Context, jid string, contactID int) bool {
	avatarURL, err := u.contactsGetter.GetProfilePictureURL(ctx, jid)
	if err != nil || avatarURL == "" {
		return false
	}

	_, err = u.client.UpdateContactSilent404(ctx, contactID, map[string]interface{}{
		"avatar_url": avatarURL,
	})
	return err == nil
}

// UpdateAllAvatarsAsync updates all contact avatars in background with worker pool
func (u *AvatarUpdater) UpdateAllAvatarsAsync(cfg *core.Config) {
	if u.contactsGetter == nil {
		return
	}

	go u.runAvatarWorkers(cfg)
}

// avatarJob represents a job for the avatar worker pool
type avatarJob struct {
	contactID  int
	identifier string
}

// runAvatarWorkers runs avatar update workers in parallel
func (u *AvatarUpdater) runAvatarWorkers(cfg *core.Config) {
	db, err := openChatwootDB(cfg)
	if err != nil {
		logger.Warn().Err(err).Msg("Chatwoot avatar: failed to connect to database")
		return
	}
	defer db.Close()

	repo := NewRepository(db, cfg.Account, cfg.InboxID)
	ctx := context.Background()

	contacts, err := repo.GetContactsWithoutAvatar(ctx)
	if err != nil {
		logger.Warn().Err(err).Msg("Chatwoot avatar: failed to fetch contacts")
		return
	}

	if len(contacts) == 0 {
		return
	}

	logger.Debug().Int("contacts", len(contacts)).Msg("Chatwoot avatar: starting background update")

	// Create job channel and worker pool
	jobs := make(chan avatarJob, len(contacts))
	var wg gosync.WaitGroup

	// Start workers
	for i := 0; i < avatarWorkerCount; i++ {
		wg.Add(1)
		go u.avatarWorker(ctx, jobs, &wg)
	}

	// Send jobs
	for _, c := range contacts {
		jobs <- avatarJob{
			contactID:  c.ID,
			identifier: c.Identifier,
		}
	}
	close(jobs)

	// Wait for completion
	wg.Wait()

	logger.Debug().Int("contacts", len(contacts)).Msg("Chatwoot avatar: background update completed")
}

// avatarWorker processes avatar update jobs
func (u *AvatarUpdater) avatarWorker(ctx context.Context, jobs <-chan avatarJob, wg *gosync.WaitGroup) {
	defer wg.Done()

	for job := range jobs {
		reqCtx, cancel := context.WithTimeout(ctx, avatarRequestTimeout)

		avatarURL, err := u.contactsGetter.GetProfilePictureURL(reqCtx, job.identifier)
		cancel()

		if err != nil || avatarURL == "" {
			continue
		}

		_, err = u.client.UpdateContactSilent404(ctx, job.contactID, map[string]interface{}{
			"avatar_url": avatarURL,
		})
		if err != nil {
			continue
		}

		time.Sleep(core.AvatarRateLimit)
	}
}

// openChatwootDB opens a connection to the Chatwoot database
func openChatwootDB(cfg *core.Config) (*sql.DB, error) {
	port := cfg.ChatwootDBPort
	if port == 0 {
		port = 5432
	}

	dsn := fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=disable",
		cfg.ChatwootDBUser, cfg.ChatwootDBPass, cfg.ChatwootDBHost, port, cfg.ChatwootDBName)

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, wrapErr("open chatwoot db", err)
	}

	if err := db.Ping(); err != nil {
		db.Close()
		return nil, wrapErr("ping chatwoot db", err)
	}

	return db, nil
}
