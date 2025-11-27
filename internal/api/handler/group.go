package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"zpwoot/internal/api/dto"
	"zpwoot/internal/service"
)

type GroupHandler struct {
	whatsappService *service.WhatsAppService
}

func NewGroupHandler(whatsappService *service.WhatsAppService) *GroupHandler {
	return &GroupHandler{whatsappService: whatsappService}
}

// CreateGroup godoc
// @Summary      Create a new group
// @Description  Create a new WhatsApp group with participants
// @Tags         groups
// @Accept       json
// @Produce      json
// @Param        name   path      string                  true  "Session name"
// @Param        body   body      dto.CreateGroupRequest  true  "Group data"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/group/create [post]
func (h *GroupHandler) CreateGroup(c *gin.Context) {
	name := c.Param("name")

	var req dto.CreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	info, err := h.whatsappService.CreateGroup(c.Request.Context(), name, req.Name, req.Participants)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{
		Success: true,
		GroupID: info.JID.String(),
		Data:    info,
	})
}

// GetGroupInfo godoc
// @Summary      Get group info
// @Description  Get information about a WhatsApp group
// @Tags         groups
// @Accept       json
// @Produce      json
// @Param        name     path      string  true  "Session name"
// @Param        groupId  path      string  true  "Group ID"
// @Success      200      {object}  dto.GroupActionResponse
// @Failure      400      {object}  dto.ErrorResponse
// @Failure      401      {object}  dto.ErrorResponse
// @Failure      500      {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/group/{groupId}/info [get]
func (h *GroupHandler) GetGroupInfo(c *gin.Context) {
	name := c.Param("name")
	groupID := c.Param("groupId")

	info, err := h.whatsappService.GetGroupInfo(c.Request.Context(), name, groupID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{
		Success: true,
		GroupID: groupID,
		Data:    info,
	})
}

// GetJoinedGroups godoc
// @Summary      Get joined groups
// @Description  Get list of groups the session is part of
// @Tags         groups
// @Accept       json
// @Produce      json
// @Param        name   path      string  true  "Session name"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/group/list [get]
func (h *GroupHandler) GetJoinedGroups(c *gin.Context) {
	name := c.Param("name")

	groups, err := h.whatsappService.GetJoinedGroups(c.Request.Context(), name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{
		Success: true,
		Data:    groups,
	})
}

// LeaveGroup godoc
// @Summary      Leave group
// @Description  Leave a WhatsApp group
// @Tags         groups
// @Accept       json
// @Produce      json
// @Param        name     path      string  true  "Session name"
// @Param        groupId  path      string  true  "Group ID"
// @Success      200      {object}  dto.GroupActionResponse
// @Failure      401      {object}  dto.ErrorResponse
// @Failure      500      {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/group/{groupId}/leave [post]
func (h *GroupHandler) LeaveGroup(c *gin.Context) {
	name := c.Param("name")
	groupID := c.Param("groupId")

	if err := h.whatsappService.LeaveGroup(c.Request.Context(), name, groupID); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{
		Success: true,
		GroupID: groupID,
	})
}

// UpdateGroupName godoc
// @Summary      Update group name
// @Description  Update the name of a WhatsApp group
// @Tags         groups
// @Accept       json
// @Produce      json
// @Param        name   path      string                  true  "Session name"
// @Param        body   body      dto.GroupUpdateRequest  true  "New name"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/group/name [put]
func (h *GroupHandler) UpdateGroupName(c *gin.Context) {
	name := c.Param("name")

	var req dto.GroupUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.whatsappService.UpdateGroupName(c.Request.Context(), name, req.GroupID, req.Value); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{
		Success: true,
		GroupID: req.GroupID,
	})
}

// UpdateGroupTopic godoc
// @Summary      Update group description
// @Description  Update the description/topic of a WhatsApp group
// @Tags         groups
// @Accept       json
// @Produce      json
// @Param        name   path      string                  true  "Session name"
// @Param        body   body      dto.GroupUpdateRequest  true  "New description"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/group/description [put]
func (h *GroupHandler) UpdateGroupTopic(c *gin.Context) {
	name := c.Param("name")

	var req dto.GroupUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.whatsappService.UpdateGroupTopic(c.Request.Context(), name, req.GroupID, req.Value); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{
		Success: true,
		GroupID: req.GroupID,
	})
}

// AddParticipants godoc
// @Summary      Add participants to group
// @Description  Add participants to a WhatsApp group
// @Tags         groups
// @Accept       json
// @Produce      json
// @Param        name   path      string                        true  "Session name"
// @Param        body   body      dto.GroupParticipantsRequest  true  "Participants"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/group/participants/add [post]
func (h *GroupHandler) AddParticipants(c *gin.Context) {
	name := c.Param("name")

	var req dto.GroupParticipantsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	result, err := h.whatsappService.AddGroupParticipants(c.Request.Context(), name, req.GroupID, req.Participants)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{
		Success: true,
		GroupID: req.GroupID,
		Data:    result,
	})
}

// RemoveParticipants godoc
// @Summary      Remove participants from group
// @Description  Remove participants from a WhatsApp group
// @Tags         groups
// @Accept       json
// @Produce      json
// @Param        name   path      string                        true  "Session name"
// @Param        body   body      dto.GroupParticipantsRequest  true  "Participants"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/group/participants/remove [post]
func (h *GroupHandler) RemoveParticipants(c *gin.Context) {
	name := c.Param("name")

	var req dto.GroupParticipantsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	result, err := h.whatsappService.RemoveGroupParticipants(c.Request.Context(), name, req.GroupID, req.Participants)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{
		Success: true,
		GroupID: req.GroupID,
		Data:    result,
	})
}

// PromoteParticipants godoc
// @Summary      Promote participants to admin
// @Description  Promote participants to admin in a WhatsApp group
// @Tags         groups
// @Accept       json
// @Produce      json
// @Param        name   path      string                        true  "Session name"
// @Param        body   body      dto.GroupParticipantsRequest  true  "Participants"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/group/participants/promote [post]
func (h *GroupHandler) PromoteParticipants(c *gin.Context) {
	name := c.Param("name")

	var req dto.GroupParticipantsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	result, err := h.whatsappService.PromoteGroupParticipants(c.Request.Context(), name, req.GroupID, req.Participants)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{
		Success: true,
		GroupID: req.GroupID,
		Data:    result,
	})
}

// DemoteParticipants godoc
// @Summary      Demote participants from admin
// @Description  Demote participants from admin in a WhatsApp group
// @Tags         groups
// @Accept       json
// @Produce      json
// @Param        name   path      string                        true  "Session name"
// @Param        body   body      dto.GroupParticipantsRequest  true  "Participants"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/group/participants/demote [post]
func (h *GroupHandler) DemoteParticipants(c *gin.Context) {
	name := c.Param("name")

	var req dto.GroupParticipantsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	result, err := h.whatsappService.DemoteGroupParticipants(c.Request.Context(), name, req.GroupID, req.Participants)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{
		Success: true,
		GroupID: req.GroupID,
		Data:    result,
	})
}

// GetInviteLink godoc
// @Summary      Get group invite link
// @Description  Get the invite link for a WhatsApp group
// @Tags         groups
// @Accept       json
// @Produce      json
// @Param        name     path      string  true   "Session name"
// @Param        groupId  path      string  true   "Group ID"
// @Param        reset    query     bool    false  "Reset link"
// @Success      200      {object}  dto.GroupInviteLinkResponse
// @Failure      401      {object}  dto.ErrorResponse
// @Failure      500      {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/group/{groupId}/invite [get]
func (h *GroupHandler) GetInviteLink(c *gin.Context) {
	name := c.Param("name")
	groupID := c.Param("groupId")
	reset := c.Query("reset") == "true"

	link, err := h.whatsappService.GetGroupInviteLink(c.Request.Context(), name, groupID, reset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupInviteLinkResponse{
		Success: true,
		GroupID: groupID,
		Link:    link,
	})
}

// JoinGroup godoc
// @Summary      Join group via link
// @Description  Join a WhatsApp group using an invite link
// @Tags         groups
// @Accept       json
// @Produce      json
// @Param        name   path      string                true  "Session name"
// @Param        body   body      dto.JoinGroupRequest  true  "Invite link"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/group/join [post]
func (h *GroupHandler) JoinGroup(c *gin.Context) {
	name := c.Param("name")

	var req dto.JoinGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	jid, err := h.whatsappService.JoinGroupWithLink(c.Request.Context(), name, req.InviteLink)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{
		Success: true,
		GroupID: jid.String(),
	})
}

// SendGroupMessage godoc
// @Summary      Send message to group
// @Description  Send a text message to a WhatsApp group
// @Tags         groups
// @Accept       json
// @Produce      json
// @Param        name   path      string                       true  "Session name"
// @Param        body   body      dto.SendGroupMessageRequest  true  "Message data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{name}/group/send/text [post]
func (h *GroupHandler) SendGroupMessage(c *gin.Context) {
	name := c.Param("name")

	var req dto.SendGroupMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.whatsappService.SendGroupMessage(c.Request.Context(), name, req.GroupID, req.Text)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SendResponse{
		Success:   true,
		MessageID: resp.ID,
		Timestamp: resp.Timestamp.Unix(),
	})
}
