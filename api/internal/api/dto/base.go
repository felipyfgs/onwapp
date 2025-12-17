package dto

const (
	ErrCodeSessionNotFound = "SESSION_NOT_FOUND"
	ErrCodeSessionExists   = "SESSION_ALREADY_EXISTS"
	ErrCodeNotConnected    = "SESSION_NOT_CONNECTED"
	ErrCodeInvalidRequest  = "INVALID_REQUEST"
	ErrCodeInvalidPhone    = "INVALID_PHONE_NUMBER"
	ErrCodeMessageFailed   = "MESSAGE_SEND_FAILED"
	ErrCodeGroupNotFound   = "GROUP_NOT_FOUND"
	ErrCodeContactNotFound = "CONTACT_NOT_FOUND"
	ErrCodeWebhookNotFound = "WEBHOOK_NOT_FOUND"
	ErrCodeUnauthorized    = "UNAUTHORIZED"
	ErrCodeInternal        = "INTERNAL_ERROR"
	ErrCodeNotImplemented  = "NOT_IMPLEMENTED"
)

type APIError struct {
	Code    string `json:"code" example:"SESSION_NOT_FOUND"`
	Message string `json:"message" example:"Session 'my-session' not found"`
}

type Response[T any] struct {
	Success bool      `json:"success" example:"true"`
	Data    T         `json:"data,omitempty"`
	Error   *APIError `json:"error,omitempty"`
}

type ListResponse[T any] struct {
	Success    bool        `json:"success" example:"true"`
	Data       []T         `json:"data"`
	Pagination *Pagination `json:"pagination,omitempty"`
}

type Pagination struct {
	Page       int  `json:"page" example:"1"`
	PerPage    int  `json:"perPage" example:"20"`
	Total      int  `json:"total" example:"100"`
	TotalPages int  `json:"totalPages" example:"5"`
	HasMore    bool `json:"hasMore" example:"true"`
}

func OK[T any](data T) Response[T] {
	return Response[T]{
		Success: true,
		Data:    data,
	}
}

func OKList[T any](data []T, pagination *Pagination) ListResponse[T] {
	return ListResponse[T]{
		Success:    true,
		Data:       data,
		Pagination: pagination,
	}
}

func Err(code, message string) Response[any] {
	return Response[any]{
		Success: false,
		Error: &APIError{
			Code:    code,
			Message: message,
		},
	}
}

func ErrSessionNotFound(name string) Response[any] {
	return Err(ErrCodeSessionNotFound, "session '"+name+"' not found")
}

func ErrSessionExists(name string) Response[any] {
	return Err(ErrCodeSessionExists, "session '"+name+"' already exists")
}

func ErrNotConnected(name string) Response[any] {
	return Err(ErrCodeNotConnected, "session '"+name+"' is not connected")
}

func ErrInvalidRequest(message string) Response[any] {
	return Err(ErrCodeInvalidRequest, message)
}

func ErrInternal(message string) Response[any] {
	return Err(ErrCodeInternal, message)
}
