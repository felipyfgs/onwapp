package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"onwapp/internal/api/dto"
	"onwapp/internal/db/repository"
	"onwapp/internal/model"
)

type QueueHandler struct {
	queueRepo *repository.QueueRepository
}

func NewQueueHandler(queueRepo *repository.QueueRepository) *QueueHandler {
	return &QueueHandler{queueRepo: queueRepo}
}

// @Summary      List queues
// @Description  List all queues
// @Tags         queues
// @Produce      json
// @Success      200  {object}  dto.ListResponse[dto.QueueData]
// @Failure      500  {object}  dto.Response[any]
// @Security     Authorization
// @Router       /queues [get]
func (h *QueueHandler) List(c *gin.Context) {
	queues, err := h.queueRepo.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	data := make([]dto.QueueData, len(queues))
	for i, q := range queues {
		data[i] = queueToDTO(q)
	}

	c.JSON(http.StatusOK, dto.OKList(data, nil))
}

// @Summary      Get queue
// @Description  Get queue by ID
// @Tags         queues
// @Produce      json
// @Param        id   path      string  true  "Queue ID"
// @Success      200  {object}  dto.Response[dto.QueueData]
// @Failure      404  {object}  dto.Response[any]
// @Failure      500  {object}  dto.Response[any]
// @Security     Authorization
// @Router       /queues/{id} [get]
func (h *QueueHandler) Get(c *gin.Context) {
	queueID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest("invalid queue ID"))
		return
	}

	queue, err := h.queueRepo.GetByID(c.Request.Context(), queueID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}
	if queue == nil {
		c.JSON(http.StatusNotFound, dto.Err("QUEUE_NOT_FOUND", "queue not found"))
		return
	}

	c.JSON(http.StatusOK, dto.OK(queueToDTO(queue)))
}

// @Summary      Create queue
// @Description  Create a new queue
// @Tags         queues
// @Accept       json
// @Produce      json
// @Param        body  body      dto.CreateQueueReq  true  "Queue data"
// @Success      201   {object}  dto.Response[dto.QueueData]
// @Failure      400   {object}  dto.Response[any]
// @Failure      500   {object}  dto.Response[any]
// @Security     Authorization
// @Router       /queues [post]
func (h *QueueHandler) Create(c *gin.Context) {
	var req dto.CreateQueueReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest(err.Error()))
		return
	}

	existing, _ := h.queueRepo.GetByName(c.Request.Context(), req.Name)
	if existing != nil {
		c.JSON(http.StatusConflict, dto.Err("QUEUE_EXISTS", "queue with this name already exists"))
		return
	}

	queue := &model.Queue{
		Name:            req.Name,
		Color:           req.Color,
		GreetingMessage: req.GreetingMessage,
	}

	if err := h.queueRepo.Create(c.Request.Context(), queue); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	c.JSON(http.StatusCreated, dto.OK(queueToDTO(queue)))
}

// @Summary      Update queue
// @Description  Update queue details
// @Tags         queues
// @Accept       json
// @Produce      json
// @Param        id    path      string            true  "Queue ID"
// @Param        body  body      dto.UpdateQueueReq   true  "Queue data"
// @Success      200   {object}  dto.Response[dto.QueueData]
// @Failure      400   {object}  dto.Response[any]
// @Failure      404   {object}  dto.Response[any]
// @Failure      500   {object}  dto.Response[any]
// @Security     Authorization
// @Router       /queues/{id} [patch]
func (h *QueueHandler) Update(c *gin.Context) {
	queueID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest("invalid queue ID"))
		return
	}

	var req dto.UpdateQueueReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest(err.Error()))
		return
	}

	queue, err := h.queueRepo.GetByID(c.Request.Context(), queueID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}
	if queue == nil {
		c.JSON(http.StatusNotFound, dto.Err("QUEUE_NOT_FOUND", "queue not found"))
		return
	}

	if req.Name != nil {
		queue.Name = *req.Name
	}
	if req.Color != nil {
		queue.Color = *req.Color
	}
	if req.GreetingMessage != nil {
		queue.GreetingMessage = req.GreetingMessage
	}

	if err := h.queueRepo.Update(c.Request.Context(), queue); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.OK(queueToDTO(queue)))
}

// @Summary      Delete queue
// @Description  Delete a queue
// @Tags         queues
// @Produce      json
// @Param        id   path      string  true  "Queue ID"
// @Success      200  {object}  dto.Response[dto.MessageData]
// @Failure      400  {object}  dto.Response[any]
// @Failure      500  {object}  dto.Response[any]
// @Security     Authorization
// @Router       /queues/{id} [delete]
func (h *QueueHandler) Delete(c *gin.Context) {
	queueID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest("invalid queue ID"))
		return
	}

	if err := h.queueRepo.Delete(c.Request.Context(), queueID); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.OK(dto.MessageData{Message: "queue deleted"}))
}

func queueToDTO(q *model.Queue) dto.QueueData {
	return dto.QueueData{
		ID:              q.ID,
		Name:            q.Name,
		Color:           q.Color,
		GreetingMessage: q.GreetingMessage,
		TicketCount:     q.TicketCount,
		UserCount:       q.UserCount,
		CreatedAt:       q.CreatedAt,
		UpdatedAt:       q.UpdatedAt,
	}
}
