package handler

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"

	"onwapp/internal/api/dto"
)

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

func respondBadRequest(c *gin.Context, message string, err error) {
	respondError(c, http.StatusBadRequest, message, err)
}

func respondUnauthorized(c *gin.Context, message string) {
	respondError(c, http.StatusUnauthorized, message, nil)
}

func respondForbidden(c *gin.Context, message string) {
	respondError(c, http.StatusForbidden, message, nil)
}

func respondNotFound(c *gin.Context, message string) {
	c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: message})
}

func respondConflict(c *gin.Context, message string, err error) {
	respondError(c, http.StatusConflict, message, err)
}

func respondInternalError(c *gin.Context, message string, err error) {
	respondError(c, http.StatusInternalServerError, message, err)
}

func respondGatewayTimeout(c *gin.Context, message string, err error) {
	respondError(c, http.StatusGatewayTimeout, message, err)
}

func respondSuccess(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, data)
}

func respondCreated(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, data)
}

func respondNoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}
