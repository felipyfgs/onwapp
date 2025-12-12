package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"onwapp/internal/api/dto"
	"onwapp/internal/db/repository"
	"onwapp/internal/model"
	"onwapp/internal/service"
)

type TicketHandler struct {
	ticketRepo     *repository.TicketRepository
	sessionService *service.SessionService
}

func NewTicketHandler(ticketRepo *repository.TicketRepository) *TicketHandler {
	return &TicketHandler{ticketRepo: ticketRepo}
}

func (h *TicketHandler) SetSessionService(s *service.SessionService) {
	h.sessionService = s
}

// @Summary      List tickets
// @Description  List tickets with optional filters
// @Tags         tickets
// @Produce      json
// @Param        session   path      string  true   "Session ID"
// @Param        status    query     string  false  "Filter by status (pending, open, closed)"
// @Param        queueId   query     string  false  "Filter by queue ID"
// @Param        userId    query     string  false  "Filter by user ID"
// @Param        search    query     string  false  "Search by contact name or JID"
// @Param        limit     query     int     false  "Limit results (default 50)"
// @Param        offset    query     int     false  "Offset for pagination"
// @Success      200       {object}  dto.ListResponse[dto.TicketData]
// @Failure      400       {object}  dto.Response[any]
// @Failure      500       {object}  dto.Response[any]
// @Security     Authorization
// @Router       /{session}/tickets [get]
func (h *TicketHandler) List(c *gin.Context) {
	sessionId := c.Param("session")

	session, err := h.sessionService.Get(sessionId)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrSessionNotFound(sessionId))
		return
	}

	sessionUUID, err := uuid.Parse(session.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal("invalid session UUID"))
		return
	}

	filter := &model.TicketFilter{
		SessionID: &sessionUUID,
		Limit:     50,
	}

	if status := c.Query("status"); status != "" {
		s := model.TicketStatus(status)
		filter.Status = &s
	}
	if queueID := c.Query("queueId"); queueID != "" {
		if id, err := uuid.Parse(queueID); err == nil {
			filter.QueueID = &id
		}
	}
	if userID := c.Query("userId"); userID != "" {
		if id, err := uuid.Parse(userID); err == nil {
			filter.UserID = &id
		}
	}
	if search := c.Query("search"); search != "" {
		filter.Search = &search
	}
	if limit := c.Query("limit"); limit != "" {
		if l, err := strconv.Atoi(limit); err == nil && l > 0 {
			filter.Limit = l
		}
	}
	if offset := c.Query("offset"); offset != "" {
		if o, err := strconv.Atoi(offset); err == nil && o >= 0 {
			filter.Offset = o
		}
	}

	tickets, total, err := h.ticketRepo.List(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	data := make([]dto.TicketData, len(tickets))
	for i, t := range tickets {
		data[i] = ticketToDTO(t)
	}

	totalPages := (total + filter.Limit - 1) / filter.Limit
	page := (filter.Offset / filter.Limit) + 1

	c.JSON(http.StatusOK, dto.OKList(data, &dto.Pagination{
		Page:       page,
		PerPage:    filter.Limit,
		Total:      total,
		TotalPages: totalPages,
		HasMore:    filter.Offset+filter.Limit < total,
	}))
}

// @Summary      Get ticket
// @Description  Get ticket by ID
// @Tags         tickets
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        id        path      string  true  "Ticket ID"
// @Success      200       {object}  dto.Response[dto.TicketData]
// @Failure      404       {object}  dto.Response[any]
// @Failure      500       {object}  dto.Response[any]
// @Security     Authorization
// @Router       /{session}/tickets/{id} [get]
func (h *TicketHandler) Get(c *gin.Context) {
	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest("invalid ticket ID"))
		return
	}

	ticket, err := h.ticketRepo.GetByIDWithRelations(c.Request.Context(), ticketID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}
	if ticket == nil {
		c.JSON(http.StatusNotFound, dto.Err("TICKET_NOT_FOUND", "ticket not found"))
		return
	}

	c.JSON(http.StatusOK, dto.OK(ticketToDTO(ticket)))
}

// @Summary      Create ticket
// @Description  Create a new ticket
// @Tags         tickets
// @Accept       json
// @Produce      json
// @Param        session   path      string            true  "Session ID"
// @Param        body      body      dto.CreateTicketReq  true  "Ticket data"
// @Success      201       {object}  dto.Response[dto.TicketData]
// @Failure      400       {object}  dto.Response[any]
// @Failure      500       {object}  dto.Response[any]
// @Security     Authorization
// @Router       /{session}/tickets [post]
func (h *TicketHandler) Create(c *gin.Context) {
	sessionId := c.Param("session")

	session, err := h.sessionService.Get(sessionId)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrSessionNotFound(sessionId))
		return
	}

	sessionUUID, err := uuid.Parse(session.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal("invalid session UUID"))
		return
	}

	var req dto.CreateTicketReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest(err.Error()))
		return
	}

	ticket := &model.Ticket{
		SessionID:     sessionUUID,
		ContactJid:    req.ContactJid,
		ContactName:   req.ContactName,
		ContactPicUrl: req.ContactPicUrl,
		Status:        model.TicketStatusPending,
		IsGroup:       req.IsGroup,
	}

	if req.QueueID != nil {
		if id, err := uuid.Parse(*req.QueueID); err == nil {
			ticket.QueueID = &id
		}
	}

	if err := h.ticketRepo.Create(c.Request.Context(), ticket); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	c.JSON(http.StatusCreated, dto.OK(ticketToDTO(ticket)))
}

// @Summary      Update ticket
// @Description  Update ticket details
// @Tags         tickets
// @Accept       json
// @Produce      json
// @Param        session   path      string            true  "Session ID"
// @Param        id        path      string            true  "Ticket ID"
// @Param        body      body      dto.UpdateTicketReq  true  "Ticket data"
// @Success      200       {object}  dto.Response[dto.TicketData]
// @Failure      400       {object}  dto.Response[any]
// @Failure      404       {object}  dto.Response[any]
// @Failure      500       {object}  dto.Response[any]
// @Security     Authorization
// @Router       /{session}/tickets/{id} [patch]
func (h *TicketHandler) Update(c *gin.Context) {
	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest("invalid ticket ID"))
		return
	}

	var req dto.UpdateTicketReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest(err.Error()))
		return
	}

	ticket, err := h.ticketRepo.GetByIDWithRelations(c.Request.Context(), ticketID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}
	if ticket == nil {
		c.JSON(http.StatusNotFound, dto.Err("TICKET_NOT_FOUND", "ticket not found"))
		return
	}

	if req.ContactName != nil {
		ticket.ContactName = req.ContactName
	}
	if req.ContactPicUrl != nil {
		ticket.ContactPicUrl = req.ContactPicUrl
	}
	if req.QueueID != nil {
		if *req.QueueID == "" {
			ticket.QueueID = nil
		} else if id, err := uuid.Parse(*req.QueueID); err == nil {
			ticket.QueueID = &id
		}
	}
	if req.UserID != nil {
		if *req.UserID == "" {
			ticket.UserID = nil
		} else if id, err := uuid.Parse(*req.UserID); err == nil {
			ticket.UserID = &id
		}
	}
	if req.Status != nil {
		ticket.Status = model.TicketStatus(*req.Status)
		if ticket.Status == model.TicketStatusClosed {
			now := time.Now()
			ticket.ClosedAt = &now
		}
	}

	if err := h.ticketRepo.Update(c.Request.Context(), ticket); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.OK(ticketToDTO(ticket)))
}

// @Summary      Accept ticket
// @Description  Accept a pending ticket (assigns to user and sets status to open)
// @Tags         tickets
// @Accept       json
// @Produce      json
// @Param        session   path      string             true  "Session ID"
// @Param        id        path      string             true  "Ticket ID"
// @Param        body      body      dto.AcceptTicketReq   true  "Accept data"
// @Success      200       {object}  dto.Response[dto.TicketData]
// @Failure      400       {object}  dto.Response[any]
// @Failure      404       {object}  dto.Response[any]
// @Failure      500       {object}  dto.Response[any]
// @Security     Authorization
// @Router       /{session}/tickets/{id}/accept [post]
func (h *TicketHandler) Accept(c *gin.Context) {
	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest("invalid ticket ID"))
		return
	}

	var req dto.AcceptTicketReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest(err.Error()))
		return
	}

	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest("invalid user ID"))
		return
	}

	ticket, err := h.ticketRepo.GetByIDWithRelations(c.Request.Context(), ticketID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}
	if ticket == nil {
		c.JSON(http.StatusNotFound, dto.Err("TICKET_NOT_FOUND", "ticket not found"))
		return
	}

	ticket.UserID = &userID
	ticket.Status = model.TicketStatusOpen

	if err := h.ticketRepo.Update(c.Request.Context(), ticket); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.OK(ticketToDTO(ticket)))
}

// @Summary      Close ticket
// @Description  Close a ticket
// @Tags         tickets
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        id        path      string  true  "Ticket ID"
// @Success      200       {object}  dto.Response[dto.TicketData]
// @Failure      404       {object}  dto.Response[any]
// @Failure      500       {object}  dto.Response[any]
// @Security     Authorization
// @Router       /{session}/tickets/{id}/close [post]
func (h *TicketHandler) Close(c *gin.Context) {
	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest("invalid ticket ID"))
		return
	}

	if err := h.ticketRepo.UpdateStatus(c.Request.Context(), ticketID, model.TicketStatusClosed); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	ticket, err := h.ticketRepo.GetByIDWithRelations(c.Request.Context(), ticketID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.OK(ticketToDTO(ticket)))
}

// @Summary      Reopen ticket
// @Description  Reopen a closed ticket
// @Tags         tickets
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        id        path      string  true  "Ticket ID"
// @Success      200       {object}  dto.Response[dto.TicketData]
// @Failure      404       {object}  dto.Response[any]
// @Failure      500       {object}  dto.Response[any]
// @Security     Authorization
// @Router       /{session}/tickets/{id}/reopen [post]
func (h *TicketHandler) Reopen(c *gin.Context) {
	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest("invalid ticket ID"))
		return
	}

	if err := h.ticketRepo.UpdateStatus(c.Request.Context(), ticketID, model.TicketStatusOpen); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	ticket, err := h.ticketRepo.GetByIDWithRelations(c.Request.Context(), ticketID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.OK(ticketToDTO(ticket)))
}

// @Summary      Transfer ticket
// @Description  Transfer ticket to another queue or user
// @Tags         tickets
// @Accept       json
// @Produce      json
// @Param        session   path      string               true  "Session ID"
// @Param        id        path      string               true  "Ticket ID"
// @Param        body      body      dto.TransferTicketReq   true  "Transfer data"
// @Success      200       {object}  dto.Response[dto.TicketData]
// @Failure      400       {object}  dto.Response[any]
// @Failure      404       {object}  dto.Response[any]
// @Failure      500       {object}  dto.Response[any]
// @Security     Authorization
// @Router       /{session}/tickets/{id}/transfer [post]
func (h *TicketHandler) Transfer(c *gin.Context) {
	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest("invalid ticket ID"))
		return
	}

	var req dto.TransferTicketReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest(err.Error()))
		return
	}

	var userID, queueID *uuid.UUID
	if req.UserID != nil && *req.UserID != "" {
		if id, err := uuid.Parse(*req.UserID); err == nil {
			userID = &id
		}
	}
	if req.QueueID != nil && *req.QueueID != "" {
		if id, err := uuid.Parse(*req.QueueID); err == nil {
			queueID = &id
		}
	}

	if err := h.ticketRepo.UpdateAssignment(c.Request.Context(), ticketID, userID, queueID); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	ticket, err := h.ticketRepo.GetByIDWithRelations(c.Request.Context(), ticketID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.OK(ticketToDTO(ticket)))
}

// @Summary      Get ticket stats
// @Description  Get ticket statistics for a session
// @Tags         tickets
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Success      200       {object}  dto.Response[dto.TicketStatsData]
// @Failure      404       {object}  dto.Response[any]
// @Failure      500       {object}  dto.Response[any]
// @Security     Authorization
// @Router       /{session}/tickets/stats [get]
func (h *TicketHandler) Stats(c *gin.Context) {
	sessionId := c.Param("session")

	session, err := h.sessionService.Get(sessionId)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrSessionNotFound(sessionId))
		return
	}

	sessionUUID, err := uuid.Parse(session.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal("invalid session UUID"))
		return
	}

	stats, err := h.ticketRepo.GetStats(c.Request.Context(), &sessionUUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.OK(dto.TicketStatsData{
		Pending: stats["pending"],
		Open:    stats["open"],
		Closed:  stats["closed"],
		Total:   stats["total"],
	}))
}

// @Summary      Delete ticket
// @Description  Delete a ticket
// @Tags         tickets
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        id        path      string  true  "Ticket ID"
// @Success      200       {object}  dto.Response[dto.MessageData]
// @Failure      400       {object}  dto.Response[any]
// @Failure      500       {object}  dto.Response[any]
// @Security     Authorization
// @Router       /{session}/tickets/{id} [delete]
func (h *TicketHandler) Delete(c *gin.Context) {
	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest("invalid ticket ID"))
		return
	}

	if err := h.ticketRepo.Delete(c.Request.Context(), ticketID); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.OK(dto.MessageData{Message: "ticket deleted"}))
}

func ticketToDTO(t *model.Ticket) dto.TicketData {
	data := dto.TicketData{
		ID:            t.ID,
		SessionID:     t.SessionID,
		ContactJid:    t.ContactJid,
		ContactName:   t.ContactName,
		ContactPicUrl: t.ContactPicUrl,
		QueueID:       t.QueueID,
		UserID:        t.UserID,
		Status:        string(t.Status),
		LastMessage:   t.LastMessage,
		UnreadCount:   t.UnreadCount,
		IsGroup:       t.IsGroup,
		ClosedAt:      t.ClosedAt,
		CreatedAt:     t.CreatedAt,
		UpdatedAt:     t.UpdatedAt,
	}

	if t.Queue != nil {
		data.Queue = &dto.QueueData{
			ID:    t.Queue.ID,
			Name:  t.Queue.Name,
			Color: t.Queue.Color,
		}
	}

	if t.User != nil {
		data.User = &dto.UserData{
			ID:      t.User.ID,
			Name:    t.User.Name,
			Email:   t.User.Email,
			Profile: string(t.User.Profile),
		}
	}

	return data
}
