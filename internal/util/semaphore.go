package util

// Semaphore limits concurrent operations using a buffered channel
type Semaphore struct {
	ch chan struct{}
}

// NewSemaphore creates a semaphore with the given maximum concurrent operations
func NewSemaphore(max int) *Semaphore {
	return &Semaphore{ch: make(chan struct{}, max)}
}

// Acquire blocks until a slot is available
func (s *Semaphore) Acquire() {
	s.ch <- struct{}{}
}

// TryAcquire attempts to acquire without blocking, returns false if full
func (s *Semaphore) TryAcquire() bool {
	select {
	case s.ch <- struct{}{}:
		return true
	default:
		return false
	}
}

// Release frees a slot
func (s *Semaphore) Release() {
	<-s.ch
}

// Available returns the number of available slots
func (s *Semaphore) Available() int {
	return cap(s.ch) - len(s.ch)
}
