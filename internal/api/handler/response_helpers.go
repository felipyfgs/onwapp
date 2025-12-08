package handler

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"

	"onwapp/internal/api/dto"
)

// respondError sends an error response with logging
func respondError(c *gin.Context, status int, message string, err error) {
	if err != nil {
		log.Error().
			Err(err).
			Str("path", c.Request.URL.Path).
			Str("method", c.Request.Method).
			Int("status", status).
			Msg(message)
		message = fmt.Sprintf("%s: %v", message, err)
	} else {
		log.Warn().
			Str("path", c.Request.URL.Path).
			Str("method", c.Request.Method).
			Int("status", status).
			Msg(message)
	}
	c.JSON(status, dto.ErrorResponse{Error: message})
}

// respondBadRequest sends a 400 Bad Request response
func respondBadRequest(c *gin.Context, message string, err error) {
	respondError(c, http.StatusBadRequest, message, err)
}

// respondUnauthorized sends a 401 Unauthorized response
func respondUnauthorized(c *gin.Context, message string) {
	respondError(c, http.StatusUnauthorized, message, nil)
}

// respondForbidden sends a 403 Forbidden response
func respondForbidden(c *gin.Context, message string) {
	respondError(c, http.StatusForbidden, message, nil)
}

// respondNotFound sends a 404 Not Found response
func respondNotFound(c *gin.Context, message string) {
	c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: message})
}

// respondConflict sends a 409 Conflict response
func respondConflict(c *gin.Context, message string, err error) {
	respondError(c, http.StatusConflict, message, err)
}

// respondInternalError sends a 500 Internal Server Error response
func respondInternalError(c *gin.Context, message string, err error) {
	respondError(c, http.StatusInternalServerError, message, err)
}

// respondGatewayTimeout sends a 504 Gateway Timeout response
func respondGatewayTimeout(c *gin.Context, message string, err error) {
	respondError(c, http.StatusGatewayTimeout, message, err)
}

// respondSuccess sends a 200 OK response with data
func respondSuccess(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, data)
}

// respondCreated sends a 201 Created response with data
func respondCreated(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, data)
}

// respondNoContent sends a 204 No Content response
func respondNoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}
