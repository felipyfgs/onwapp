package handler

import (
	"fmt"
	"strconv"

	"github.com/gin-gonic/gin"
)

const (
	defaultChatsLimit = 100
	maxChatsLimit     = 500

	defaultMessagesLimit = 50
	maxMessagesLimit     = 200

	defaultLimit = 20
	maxLimit     = 100
)

type PaginationParams struct {
	Limit  int
	Offset int
}

func parsePaginationParams(c *gin.Context, defaultLimit, maxLimit int) (*PaginationParams, error) {
	limitStr := c.DefaultQuery("limit", strconv.Itoa(defaultLimit))
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		return nil, fmt.Errorf("invalid limit parameter: must be a number")
	}

	if limit < 1 {
		return nil, fmt.Errorf("limit must be at least 1")
	}

	if limit > maxLimit {
		return nil, fmt.Errorf("limit exceeds maximum of %d", maxLimit)
	}

	offsetStr := c.DefaultQuery("offset", "0")
	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		return nil, fmt.Errorf("invalid offset parameter: must be a number")
	}

	if offset < 0 {
		return nil, fmt.Errorf("offset cannot be negative")
	}

	return &PaginationParams{
		Limit:  limit,
		Offset: offset,
	}, nil
}

func ParseChatsPagination(c *gin.Context) (*PaginationParams, error) {
	return parsePaginationParams(c, defaultChatsLimit, maxChatsLimit)
}

func ParseMessagesPagination(c *gin.Context) (*PaginationParams, error) {
	return parsePaginationParams(c, defaultMessagesLimit, maxMessagesLimit)
}

func ParseGeneralPagination(c *gin.Context) (*PaginationParams, error) {
	return parsePaginationParams(c, defaultLimit, maxLimit)
}
