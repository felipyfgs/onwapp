package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"onwapp/internal/api/dto"
	"onwapp/internal/db/repository"
	"onwapp/internal/model"
)

type QuickReplyHandler struct {
	quickReplyRepo *repository.QuickReplyRepository
}

func NewQuickReplyHandler(quickReplyRepo *repository.QuickReplyRepository) *QuickReplyHandler {
	return &QuickReplyHandler{quickReplyRepo: quickReplyRepo}
}

// @Summary      List quick replies
// @Description  List all quick replies
// @Tags         quick-replies
// @Produce      json
// @Param        search  query     string  false  "Search query"
// @Success      200     {object}  dto.ListResponse[dto.QuickReplyData]
// @Failure      500     {object}  dto.Response[any]
// @Security     Authorization
// @Router       /quick-replies [get]
func (h *QuickReplyHandler) List(c *gin.Context) {
	var quickReplies []*model.QuickReply
	var err error

	if search := c.Query("search"); search != "" {
		quickReplies, err = h.quickReplyRepo.Search(c.Request.Context(), search)
	} else {
		quickReplies, err = h.quickReplyRepo.List(c.Request.Context())
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	data := make([]dto.QuickReplyData, len(quickReplies))
	for i, qr := range quickReplies {
		data[i] = quickReplyToDTO(qr)
	}

	c.JSON(http.StatusOK, dto.OKList(data, nil))
}

// @Summary      Get quick reply
// @Description  Get quick reply by ID
// @Tags         quick-replies
// @Produce      json
// @Param        id   path      string  true  "Quick reply ID"
// @Success      200  {object}  dto.Response[dto.QuickReplyData]
// @Failure      404  {object}  dto.Response[any]
// @Failure      500  {object}  dto.Response[any]
// @Security     Authorization
// @Router       /quick-replies/{id} [get]
func (h *QuickReplyHandler) Get(c *gin.Context) {
	qrID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest("invalid quick reply ID"))
		return
	}

	qr, err := h.quickReplyRepo.GetByID(c.Request.Context(), qrID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}
	if qr == nil {
		c.JSON(http.StatusNotFound, dto.Err("QUICK_REPLY_NOT_FOUND", "quick reply not found"))
		return
	}

	c.JSON(http.StatusOK, dto.OK(quickReplyToDTO(qr)))
}

// @Summary      Create quick reply
// @Description  Create a new quick reply
// @Tags         quick-replies
// @Accept       json
// @Produce      json
// @Param        body  body      dto.CreateQuickReplyReq  true  "Quick reply data"
// @Success      201   {object}  dto.Response[dto.QuickReplyData]
// @Failure      400   {object}  dto.Response[any]
// @Failure      409   {object}  dto.Response[any]
// @Failure      500   {object}  dto.Response[any]
// @Security     Authorization
// @Router       /quick-replies [post]
func (h *QuickReplyHandler) Create(c *gin.Context) {
	var req dto.CreateQuickReplyReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest(err.Error()))
		return
	}

	existing, _ := h.quickReplyRepo.GetByShortcut(c.Request.Context(), req.Shortcut)
	if existing != nil {
		c.JSON(http.StatusConflict, dto.Err("SHORTCUT_EXISTS", "quick reply with this shortcut already exists"))
		return
	}

	qr := &model.QuickReply{
		Shortcut: req.Shortcut,
		Message:  req.Message,
	}

	if err := h.quickReplyRepo.Create(c.Request.Context(), qr); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	c.JSON(http.StatusCreated, dto.OK(quickReplyToDTO(qr)))
}

// @Summary      Update quick reply
// @Description  Update quick reply details
// @Tags         quick-replies
// @Accept       json
// @Produce      json
// @Param        id    path      string                  true  "Quick reply ID"
// @Param        body  body      dto.UpdateQuickReplyReq    true  "Quick reply data"
// @Success      200   {object}  dto.Response[dto.QuickReplyData]
// @Failure      400   {object}  dto.Response[any]
// @Failure      404   {object}  dto.Response[any]
// @Failure      500   {object}  dto.Response[any]
// @Security     Authorization
// @Router       /quick-replies/{id} [patch]
func (h *QuickReplyHandler) Update(c *gin.Context) {
	qrID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest("invalid quick reply ID"))
		return
	}

	var req dto.UpdateQuickReplyReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest(err.Error()))
		return
	}

	qr, err := h.quickReplyRepo.GetByID(c.Request.Context(), qrID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}
	if qr == nil {
		c.JSON(http.StatusNotFound, dto.Err("QUICK_REPLY_NOT_FOUND", "quick reply not found"))
		return
	}

	if req.Shortcut != nil {
		qr.Shortcut = *req.Shortcut
	}
	if req.Message != nil {
		qr.Message = *req.Message
	}

	if err := h.quickReplyRepo.Update(c.Request.Context(), qr); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.OK(quickReplyToDTO(qr)))
}

// @Summary      Delete quick reply
// @Description  Delete a quick reply
// @Tags         quick-replies
// @Produce      json
// @Param        id   path      string  true  "Quick reply ID"
// @Success      200  {object}  dto.Response[dto.MessageData]
// @Failure      400  {object}  dto.Response[any]
// @Failure      500  {object}  dto.Response[any]
// @Security     Authorization
// @Router       /quick-replies/{id} [delete]
func (h *QuickReplyHandler) Delete(c *gin.Context) {
	qrID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest("invalid quick reply ID"))
		return
	}

	if err := h.quickReplyRepo.Delete(c.Request.Context(), qrID); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.OK(dto.MessageData{Message: "quick reply deleted"}))
}

func quickReplyToDTO(qr *model.QuickReply) dto.QuickReplyData {
	return dto.QuickReplyData{
		ID:        qr.ID,
		Shortcut:  qr.Shortcut,
		Message:   qr.Message,
		CreatedAt: qr.CreatedAt,
		UpdatedAt: qr.UpdatedAt,
	}
}
