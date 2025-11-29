package dto

// Error codes
const (
	ErrCodeSessionNotFound    = "SESSION_NOT_FOUND"
	ErrCodeSessionExists      = "SESSION_ALREADY_EXISTS"
	ErrCodeNotConnected       = "SESSION_NOT_CONNECTED"
	ErrCodeInvalidRequest     = "INVALID_REQUEST"
	ErrCodeInvalidPhone       = "INVALID_PHONE_NUMBER"
	ErrCodeMessageFailed      = "MESSAGE_SEND_FAILED"
	ErrCodeGroupNotFound      = "GROUP_NOT_FOUND"
	ErrCodeContactNotFound    = "CONTACT_NOT_FOUND"
	ErrCodeWebhookNotFound    = "WEBHOOK_NOT_FOUND"
	ErrCodeUnauthorized       = "UNAUTHORIZED"
	ErrCodeInternal           = "INTERNAL_ERROR"
	ErrCodeNotImplemented     = "NOT_IMPLEMENTED"
)

// APIError represents a structured error response
type APIError struct {
	Code    string `json:"code" example:"SESSION_NOT_FOUND"`
	Message string `json:"message" example:"Session 'my-session' not found"`
}

// Response is the standard envelope for all API responses
type Response[T any] struct {
	Success bool      `json:"success" example:"true"`
	Data    T         `json:"data,omitempty"`
	Error   *APIError `json:"error,omitempty"`
}

// ListResponse is the standard envelope for list/array responses
type ListResponse[T any] struct {
	Success    bool        `json:"success" example:"true"`
	Data       []T         `json:"data"`
	Pagination *Pagination `json:"pagination,omitempty"`
}

// Pagination contains pagination metadata
type Pagination struct {
	Page       int  `json:"page" example:"1"`
	PerPage    int  `json:"perPage" example:"20"`
	Total      int  `json:"total" example:"100"`
	TotalPages int  `json:"totalPages" example:"5"`
	HasMore    bool `json:"hasMore" example:"true"`
}

// Helper functions for creating responses

// OK creates a success response with data
func OK[T any](data T) Response[T] {
	return Response[T]{
		Success: true,
		Data:    data,
	}
}

// OKList creates a success response for lists
func OKList[T any](data []T, pagination *Pagination) ListResponse[T] {
	return ListResponse[T]{
		Success:    true,
		Data:       data,
		Pagination: pagination,
	}
}

// Err creates an error response
func Err(code, message string) Response[any] {
	return Response[any]{
		Success: false,
		Error: &APIError{
			Code:    code,
			Message: message,
		},
	}
}

// ErrSessionNotFound creates a session not found error
func ErrSessionNotFound(name string) Response[any] {
	return Err(ErrCodeSessionNotFound, "session '"+name+"' not found")
}

// ErrSessionExists creates a session already exists error
func ErrSessionExists(name string) Response[any] {
	return Err(ErrCodeSessionExists, "session '"+name+"' already exists")
}

// ErrNotConnected creates a not connected error
func ErrNotConnected(name string) Response[any] {
	return Err(ErrCodeNotConnected, "session '"+name+"' is not connected")
}

// ErrInvalidRequest creates an invalid request error
func ErrInvalidRequest(message string) Response[any] {
	return Err(ErrCodeInvalidRequest, message)
}

// ErrInternal creates an internal error
func ErrInternal(message string) Response[any] {
	return Err(ErrCodeInternal, message)
}
