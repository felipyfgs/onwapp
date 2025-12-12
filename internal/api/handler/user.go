package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"onwapp/internal/api/dto"
	"onwapp/internal/db/repository"
	"onwapp/internal/model"
)

type UserHandler struct {
	userRepo  *repository.UserRepository
	queueRepo *repository.QueueRepository
}

func NewUserHandler(userRepo *repository.UserRepository, queueRepo *repository.QueueRepository) *UserHandler {
	return &UserHandler{userRepo: userRepo, queueRepo: queueRepo}
}

// @Summary      List users
// @Description  List all users with their queues
// @Tags         users
// @Produce      json
// @Success      200  {object}  dto.ListResponse[dto.UserData]
// @Failure      500  {object}  dto.Response[any]
// @Security     Authorization
// @Router       /users [get]
func (h *UserHandler) List(c *gin.Context) {
	users, err := h.userRepo.ListWithQueues(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	data := make([]dto.UserData, len(users))
	for i, u := range users {
		data[i] = userToDTO(u)
	}

	c.JSON(http.StatusOK, dto.OKList(data, nil))
}

// @Summary      Get user
// @Description  Get user by ID
// @Tags         users
// @Produce      json
// @Param        id   path      string  true  "User ID"
// @Success      200  {object}  dto.Response[dto.UserData]
// @Failure      404  {object}  dto.Response[any]
// @Failure      500  {object}  dto.Response[any]
// @Security     Authorization
// @Router       /users/{id} [get]
func (h *UserHandler) Get(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest("invalid user ID"))
		return
	}

	user, err := h.userRepo.GetByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}
	if user == nil {
		c.JSON(http.StatusNotFound, dto.Err("USER_NOT_FOUND", "user not found"))
		return
	}

	queues, _ := h.queueRepo.GetUserQueues(c.Request.Context(), userID)
	if queues != nil {
		user.Queues = make([]model.Queue, len(queues))
		for i, q := range queues {
			user.Queues[i] = *q
		}
	}

	c.JSON(http.StatusOK, dto.OK(userToDTO(user)))
}

// @Summary      Create user
// @Description  Create a new user
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        body  body      dto.CreateUserReq  true  "User data"
// @Success      201   {object}  dto.Response[dto.UserData]
// @Failure      400   {object}  dto.Response[any]
// @Failure      409   {object}  dto.Response[any]
// @Failure      500   {object}  dto.Response[any]
// @Security     Authorization
// @Router       /users [post]
func (h *UserHandler) Create(c *gin.Context) {
	var req dto.CreateUserReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest(err.Error()))
		return
	}

	existing, _ := h.userRepo.GetByEmail(c.Request.Context(), req.Email)
	if existing != nil {
		c.JSON(http.StatusConflict, dto.Err("USER_EXISTS", "user with this email already exists"))
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal("failed to hash password"))
		return
	}

	user := &model.User{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Profile:      model.UserProfile(req.Profile),
	}

	if err := h.userRepo.Create(c.Request.Context(), user); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	if len(req.QueueIDs) > 0 {
		queueIDs := make([]uuid.UUID, 0, len(req.QueueIDs))
		for _, idStr := range req.QueueIDs {
			if id, err := uuid.Parse(idStr); err == nil {
				queueIDs = append(queueIDs, id)
			}
		}
		if len(queueIDs) > 0 {
			_ = h.queueRepo.SetUserQueues(c.Request.Context(), user.ID, queueIDs)
		}
	}

	c.JSON(http.StatusCreated, dto.OK(userToDTO(user)))
}

// @Summary      Update user
// @Description  Update user details
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        id    path      string           true  "User ID"
// @Param        body  body      dto.UpdateUserReq   true  "User data"
// @Success      200   {object}  dto.Response[dto.UserData]
// @Failure      400   {object}  dto.Response[any]
// @Failure      404   {object}  dto.Response[any]
// @Failure      500   {object}  dto.Response[any]
// @Security     Authorization
// @Router       /users/{id} [patch]
func (h *UserHandler) Update(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest("invalid user ID"))
		return
	}

	var req dto.UpdateUserReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest(err.Error()))
		return
	}

	user, err := h.userRepo.GetByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}
	if user == nil {
		c.JSON(http.StatusNotFound, dto.Err("USER_NOT_FOUND", "user not found"))
		return
	}

	if req.Name != nil {
		user.Name = *req.Name
	}
	if req.Email != nil {
		user.Email = *req.Email
	}
	if req.Profile != nil {
		user.Profile = model.UserProfile(*req.Profile)
	}

	if err := h.userRepo.Update(c.Request.Context(), user); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	if req.QueueIDs != nil {
		queueIDs := make([]uuid.UUID, 0, len(req.QueueIDs))
		for _, idStr := range req.QueueIDs {
			if id, err := uuid.Parse(idStr); err == nil {
				queueIDs = append(queueIDs, id)
			}
		}
		_ = h.queueRepo.SetUserQueues(c.Request.Context(), user.ID, queueIDs)
	}

	queues, _ := h.queueRepo.GetUserQueues(c.Request.Context(), userID)
	if queues != nil {
		user.Queues = make([]model.Queue, len(queues))
		for i, q := range queues {
			user.Queues[i] = *q
		}
	}

	c.JSON(http.StatusOK, dto.OK(userToDTO(user)))
}

// @Summary      Update user password
// @Description  Update user password
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        id    path      string                   true  "User ID"
// @Param        body  body      dto.UpdateUserPasswordReq   true  "Password data"
// @Success      200   {object}  dto.Response[dto.MessageData]
// @Failure      400   {object}  dto.Response[any]
// @Failure      404   {object}  dto.Response[any]
// @Failure      500   {object}  dto.Response[any]
// @Security     Authorization
// @Router       /users/{id}/password [patch]
func (h *UserHandler) UpdatePassword(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest("invalid user ID"))
		return
	}

	var req dto.UpdateUserPasswordReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest(err.Error()))
		return
	}

	user, err := h.userRepo.GetByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}
	if user == nil {
		c.JSON(http.StatusNotFound, dto.Err("USER_NOT_FOUND", "user not found"))
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal("failed to hash password"))
		return
	}

	if err := h.userRepo.UpdatePassword(c.Request.Context(), userID, string(hashedPassword)); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.OK(dto.MessageData{Message: "password updated"}))
}

// @Summary      Set user queues
// @Description  Set queues for a user
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        id    path      string              true  "User ID"
// @Param        body  body      dto.SetUserQueuesReq   true  "Queue IDs"
// @Success      200   {object}  dto.Response[dto.UserData]
// @Failure      400   {object}  dto.Response[any]
// @Failure      404   {object}  dto.Response[any]
// @Failure      500   {object}  dto.Response[any]
// @Security     Authorization
// @Router       /users/{id}/queues [post]
func (h *UserHandler) SetQueues(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest("invalid user ID"))
		return
	}

	var req dto.SetUserQueuesReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest(err.Error()))
		return
	}

	user, err := h.userRepo.GetByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}
	if user == nil {
		c.JSON(http.StatusNotFound, dto.Err("USER_NOT_FOUND", "user not found"))
		return
	}

	queueIDs := make([]uuid.UUID, 0, len(req.QueueIDs))
	for _, idStr := range req.QueueIDs {
		if id, err := uuid.Parse(idStr); err == nil {
			queueIDs = append(queueIDs, id)
		}
	}

	if err := h.queueRepo.SetUserQueues(c.Request.Context(), userID, queueIDs); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	queues, _ := h.queueRepo.GetUserQueues(c.Request.Context(), userID)
	if queues != nil {
		user.Queues = make([]model.Queue, len(queues))
		for i, q := range queues {
			user.Queues[i] = *q
		}
	}

	c.JSON(http.StatusOK, dto.OK(userToDTO(user)))
}

// @Summary      Delete user
// @Description  Delete a user
// @Tags         users
// @Produce      json
// @Param        id   path      string  true  "User ID"
// @Success      200  {object}  dto.Response[dto.MessageData]
// @Failure      400  {object}  dto.Response[any]
// @Failure      500  {object}  dto.Response[any]
// @Security     Authorization
// @Router       /users/{id} [delete]
func (h *UserHandler) Delete(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrInvalidRequest("invalid user ID"))
		return
	}

	if err := h.userRepo.Delete(c.Request.Context(), userID); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrInternal(err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.OK(dto.MessageData{Message: "user deleted"}))
}

func userToDTO(u *model.User) dto.UserData {
	data := dto.UserData{
		ID:        u.ID,
		Name:      u.Name,
		Email:     u.Email,
		Profile:   string(u.Profile),
		Online:    u.Online,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}

	if len(u.Queues) > 0 {
		data.Queues = make([]dto.QueueData, len(u.Queues))
		for i, q := range u.Queues {
			data.Queues[i] = dto.QueueData{
				ID:    q.ID,
				Name:  q.Name,
				Color: q.Color,
			}
		}
	}

	return data
}
