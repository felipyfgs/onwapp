package handler

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/skip2/go-qrcode"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types"

	"onwapp/internal/api/dto"
	"onwapp/internal/db"
	"onwapp/internal/logger"
	"onwapp/internal/model"
	"onwapp/internal/service"
	"onwapp/internal/service/wpp"
)

func generateAPIKey() string {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return ""
	}
	return hex.EncodeToString(bytes)
}

type SessionHandler struct {
	sessionService *service.SessionService
	wpp            *wpp.Service
	database       *db.Database
}

func NewSessionHandler(sessionService *service.SessionService, wpp *wpp.Service, database *db.Database) *SessionHandler {
	return &SessionHandler{sessionService: sessionService, wpp: wpp, database: database}
}

func sessionToResponse(sess *model.Session) dto.SessionResponse {
	resp := dto.SessionResponse{
		ID:      sess.ID,
		Session: sess.Session,
		Status:  string(sess.GetStatus()),
	}
	if sess.DeviceJID != "" {
		resp.DeviceJID = &sess.DeviceJID
	}
	if sess.Phone != "" {
		resp.Phone = &sess.Phone
	}
	if sess.ApiKey != "" {
		resp.ApiKey = &sess.ApiKey
	}
	if sess.CreatedAt != nil {
		resp.CreatedAt = sess.CreatedAt.Format("2006-01-02T15:04:05.999999Z07:00")
	}
	if sess.UpdatedAt != nil {
		resp.UpdatedAt = sess.UpdatedAt.Format("2006-01-02T15:04:05.999999Z07:00")
	}
	return resp
}

// @Summary      Fetch all sessions
// @Description  Get a list of all WhatsApp sessions with profile and stats
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Success      200    {array}   dto.SessionResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /sessions [get]
func (h *SessionHandler) Fetch(c *gin.Context) {
	sessions := h.sessionService.List()

	response := make([]dto.SessionResponse, 0, len(sessions))
	for _, name := range sessions {
		sess, err := h.sessionService.Get(name)
		if err != nil {
			continue
		}
		resp := sessionToResponse(sess)

		if sess.GetStatus() == model.StatusConnected {
			h.enrichSessionResponse(c.Request.Context(), sess, &resp)
		}

		response = append(response, resp)
	}

	c.JSON(http.StatusOK, response)
}

func (h *SessionHandler) enrichSessionResponse(ctx context.Context, sess *model.Session, resp *dto.SessionResponse) {
	if sess.Client != nil && sess.Client.Store != nil && sess.Client.Store.ID != nil {
		storeID := sess.Client.Store.ID

		if resp.DeviceJID == nil {
			jid := storeID.String()
			resp.DeviceJID = &jid
		}

		if resp.Phone == nil && storeID.User != "" {
			resp.Phone = &storeID.User
		}

		pushName := sess.Client.Store.PushName
		if pushName != "" {
			resp.PushName = &pushName
		}

		userJID := types.NewJID(storeID.User, types.DefaultUserServer)
		pic, err := sess.Client.GetProfilePictureInfo(ctx, userJID, &whatsmeow.GetProfilePictureParams{})
		if err != nil {
			logger.API().Debug().Err(err).Str("session", sess.Session).Str("jid", userJID.String()).Msg("Failed to get profile picture")
		} else if pic != nil && pic.URL != "" {
			resp.ProfilePicture = &pic.URL
		}
	}

	stats := &dto.SessionStats{}

	if h.database != nil {
		if msgCount, err := h.database.Messages.CountBySession(ctx, sess.ID); err == nil {
			stats.Messages = msgCount
		}

		if chatCount, err := h.database.Chats.CountBySession(ctx, sess.ID); err == nil {
			stats.Chats = chatCount
		}
	}

	if sess.Client != nil && sess.Client.Store != nil {
		contacts, err := sess.Client.Store.Contacts.GetAllContacts(ctx)
		if err == nil {
			stats.Contacts = len(contacts)
		}
	}

	if sess.Client != nil {
		groups, err := sess.Client.GetJoinedGroups(ctx)
		if err == nil {
			stats.Groups = len(groups)
		}
	}

	resp.Stats = stats
}

// @Summary      Create a new session
// @Description  Create a new WhatsApp session with the given name
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        request body      dto.CreateSessionRequest  true  "Session data"
// @Success      201    {object}  dto.SessionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      409    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /sessions [post]
func (h *SessionHandler) Create(c *gin.Context) {
	var req dto.CreateSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	apiKey := req.ApiKey
	if apiKey == "" {
		apiKey = generateAPIKey()
	}

	session, err := h.sessionService.Create(c.Request.Context(), req.Session, apiKey)
	if err != nil {
		c.JSON(http.StatusConflict, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, sessionToResponse(session))
}

// @Summary      Delete a session
// @Description  Delete an existing WhatsApp session
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Success      200    {object}  dto.MessageResponse
// @Failure      404    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session} [delete]
func (h *SessionHandler) Delete(c *gin.Context) {
	sessionId := c.Param("session")

	if err := h.sessionService.Delete(c.Request.Context(), sessionId); err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "session deleted"})
}

// @Summary      Get session info
// @Description  Get information about a WhatsApp session
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Success      200    {object}  dto.SessionResponse
// @Failure      404    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/status [get]
func (h *SessionHandler) Info(c *gin.Context) {
	sessionId := c.Param("session")

	session, err := h.sessionService.Get(sessionId)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp := sessionToResponse(session)
	if session.GetStatus() == model.StatusConnected {
		h.enrichSessionResponse(c.Request.Context(), session, &resp)
	}

	c.JSON(http.StatusOK, resp)
}

// @Summary      Connect session
// @Description  Connect a WhatsApp session. If not authenticated, returns QR code endpoint
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Success      200    {object}  dto.MessageResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/connect [post]
func (h *SessionHandler) Connect(c *gin.Context) {
	sessionId := c.Param("session")

	session, err := h.sessionService.Connect(c.Request.Context(), sessionId)
	if err != nil {
		if err.Error() == fmt.Sprintf("session %s not found", sessionId) {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if session.Client.Store.ID == nil {
		c.JSON(http.StatusOK, dto.MessageResponse{
			Message: "connecting, check terminal for QR code or use /sessions/" + sessionId + "/qr",
			Status:  string(model.StatusConnecting),
		})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{
		Message: "connected",
		Status:  string(session.GetStatus()),
	})
}

// @Summary      Disconnect session
// @Description  Disconnect from WhatsApp but keep credentials (can auto-reconnect)
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Success      200    {object}  dto.MessageResponse
// @Failure      404    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/disconnect [post]
func (h *SessionHandler) Disconnect(c *gin.Context) {
	sessionId := c.Param("session")

	if err := h.sessionService.Disconnect(c.Request.Context(), sessionId); err != nil {
		if err.Error() == "session "+sessionId+" not found" {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "disconnected (credentials kept, use /connect to reconnect)"})
}

// @Summary      Logout session
// @Description  Logout from WhatsApp and clear credentials (requires new QR scan to reconnect)
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Success      200    {object}  dto.MessageResponse
// @Failure      404    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/logout [post]
func (h *SessionHandler) Logout(c *gin.Context) {
	sessionId := c.Param("session")

	if err := h.sessionService.Logout(c.Request.Context(), sessionId); err != nil {
		if err.Error() == "session "+sessionId+" not found" {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{Message: "logged out (credentials cleared, scan QR to reconnect)"})
}

// @Summary      Restart session
// @Description  Disconnect and reconnect a WhatsApp session
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Success      200    {object}  dto.MessageResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/restart [post]
func (h *SessionHandler) Restart(c *gin.Context) {
	sessionId := c.Param("session")

	session, err := h.sessionService.Restart(c.Request.Context(), sessionId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{
		Message: "restarted",
		Status:  string(session.GetStatus()),
	})
}

// @Summary      Get QR code
// @Description  Get QR code for WhatsApp authentication
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        format  query     string  false  "Response format (json or image)"  default(json)
// @Success      200     {object}  dto.QRResponse
// @Failure      404     {object}  dto.ErrorResponse
// @Failure      401     {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/qr [get]
func (h *SessionHandler) QR(c *gin.Context) {
	sessionId := c.Param("session")
	format := c.DefaultQuery("format", "json")

	session, err := h.sessionService.Get(sessionId)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: err.Error()})
		return
	}

	qr := session.GetQR()
	if qr == "" {
		c.JSON(http.StatusOK, dto.QRResponse{
			Status: string(session.GetStatus()),
		})
		return
	}

	if format == "image" {
		png, err := qrcode.Encode(qr, qrcode.Medium, 256)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "failed to generate QR image"})
			return
		}
		c.Data(http.StatusOK, "image/png", png)
		return
	}

	image, _ := qrcode.Encode(qr, qrcode.Medium, 256)
	base64QR := "data:image/png;base64," + base64.StdEncoding.EncodeToString(image)

	c.JSON(http.StatusOK, dto.QRResponse{
		QR:     base64QR,
		Status: string(session.GetStatus()),
	})
}

// @Summary      Pair using phone number
// @Description  Pair WhatsApp session using phone number instead of QR code
// @Tags         sessions
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.PairPhoneRequest true  "Phone data"
// @Success      200    {object}  dto.PairPhoneResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/pairphone [post]
func (h *SessionHandler) PairPhone(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.PairPhoneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	code, err := h.wpp.PairPhone(c.Request.Context(), sessionId, req.Phone)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.PairPhoneResponse{Code: code})
}
