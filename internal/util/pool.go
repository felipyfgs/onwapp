package util

import (
	"bytes"
	"sync"
)

// BufferPool provides reusable byte buffers to reduce allocations
var BufferPool = sync.Pool{
	New: func() interface{} {
		return new(bytes.Buffer)
	},
}

// GetBuffer retrieves a buffer from the pool (reset and ready to use)
func GetBuffer() *bytes.Buffer {
	buf := BufferPool.Get().(*bytes.Buffer)
	buf.Reset()
	return buf
}

// PutBuffer returns a buffer to the pool for reuse
func PutBuffer(buf *bytes.Buffer) {
	if buf != nil {
		BufferPool.Put(buf)
	}
}
