package handler

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types"

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
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.CreateGroupRequest  true  "Group data"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/groups [post]
func (h *GroupHandler) CreateGroup(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.CreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	info, err := h.whatsappService.CreateGroup(c.Request.Context(), sessionId, req.Name, req.Participants)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{

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
// @Param        sessionId   path      string  true  "Session ID"
// @Param        groupId  path      string  true  "Group ID"
// @Success      200      {object}  dto.GroupActionResponse
// @Failure      400      {object}  dto.ErrorResponse
// @Failure      401      {object}  dto.ErrorResponse
// @Failure      500      {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/groups/{groupId} [get]
func (h *GroupHandler) GetGroupInfo(c *gin.Context) {
	sessionId := c.Param("sessionId")
	groupID := c.Param("groupId")

	info, err := h.whatsappService.GetGroupInfo(c.Request.Context(), sessionId, groupID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{

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
// @Param        sessionId   path      string  true  "Session ID"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/groups [get]
func (h *GroupHandler) GetJoinedGroups(c *gin.Context) {
	sessionId := c.Param("sessionId")

	groups, err := h.whatsappService.GetJoinedGroups(c.Request.Context(), sessionId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{

		Data: groups,
	})
}

// LeaveGroup godoc
// @Summary      Leave group
// @Description  Leave a WhatsApp group
// @Tags         groups
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        groupId  path      string  true  "Group ID"
// @Success      200      {object}  dto.GroupActionResponse
// @Failure      401      {object}  dto.ErrorResponse
// @Failure      500      {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/groups/{groupId}/membership [delete]
func (h *GroupHandler) LeaveGroup(c *gin.Context) {
	sessionId := c.Param("sessionId")
	groupID := c.Param("groupId")

	if err := h.whatsappService.LeaveGroup(c.Request.Context(), sessionId, groupID); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{

		GroupID: groupID,
	})
}

// UpdateGroupName godoc
// @Summary      Update group name
// @Description  Update the name of a WhatsApp group
// @Tags         groups
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.GroupUpdateRequest  true  "New name"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/groups/{groupId}/name [patch]
func (h *GroupHandler) UpdateGroupName(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.GroupUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.whatsappService.UpdateGroupName(c.Request.Context(), sessionId, req.GroupID, req.Value); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{

		GroupID: req.GroupID,
	})
}

// UpdateGroupTopic godoc
// @Summary      Update group description
// @Description  Update the description/topic of a WhatsApp group
// @Tags         groups
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.GroupUpdateRequest  true  "New description"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/groups/{groupId}/description [patch]
func (h *GroupHandler) UpdateGroupTopic(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.GroupUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.whatsappService.UpdateGroupTopic(c.Request.Context(), sessionId, req.GroupID, req.Value); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{

		GroupID: req.GroupID,
	})
}

// AddParticipants godoc
// @Summary      Add participants to group
// @Description  Add participants to a WhatsApp group
// @Tags         groups
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.GroupParticipantsRequest  true  "Participants"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/groups/{groupId}/participants [post]
func (h *GroupHandler) AddParticipants(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.GroupParticipantsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	result, err := h.whatsappService.AddGroupParticipants(c.Request.Context(), sessionId, req.GroupID, req.Participants)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{

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
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.GroupParticipantsRequest  true  "Participants"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/groups/{groupId}/participants [delete]
func (h *GroupHandler) RemoveParticipants(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.GroupParticipantsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	result, err := h.whatsappService.RemoveGroupParticipants(c.Request.Context(), sessionId, req.GroupID, req.Participants)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{

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
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.GroupParticipantsRequest  true  "Participants"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/groups/{groupId}/participants/promote [patch]
func (h *GroupHandler) PromoteParticipants(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.GroupParticipantsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	result, err := h.whatsappService.PromoteGroupParticipants(c.Request.Context(), sessionId, req.GroupID, req.Participants)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{

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
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.GroupParticipantsRequest  true  "Participants"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/groups/{groupId}/participants/demote [patch]
func (h *GroupHandler) DemoteParticipants(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.GroupParticipantsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	result, err := h.whatsappService.DemoteGroupParticipants(c.Request.Context(), sessionId, req.GroupID, req.Participants)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{

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
// @Param        sessionId   path      string  true  "Session ID"
// @Param        groupId  path      string  true   "Group ID"
// @Param        reset    query     bool    false  "Reset link"
// @Success      200      {object}  dto.GroupInviteLinkResponse
// @Failure      401      {object}  dto.ErrorResponse
// @Failure      500      {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/groups/{groupId}/invite [get]
func (h *GroupHandler) GetInviteLink(c *gin.Context) {
	sessionId := c.Param("sessionId")
	groupID := c.Param("groupId")
	reset := c.Query("reset") == "true"

	link, err := h.whatsappService.GetGroupInviteLink(c.Request.Context(), sessionId, groupID, reset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupInviteLinkResponse{

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
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.JoinGroupRequest  true  "Invite link"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/groups/join [post]
func (h *GroupHandler) JoinGroup(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.JoinGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	jid, err := h.whatsappService.JoinGroupWithLink(c.Request.Context(), sessionId, req.InviteLink)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{

		GroupID: jid.String(),
	})
}

// SendGroupMessage godoc
// @Summary      Send message to group
// @Description  Send a text message to a WhatsApp group
// @Tags         groups
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.SendGroupMessageRequest  true  "Message data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/groups/{groupId}/messages [post]
func (h *GroupHandler) SendGroupMessage(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.SendGroupMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.whatsappService.SendGroupMessage(c.Request.Context(), sessionId, req.GroupID, req.Text)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SendResponse{

		MessageID: resp.ID,
		Timestamp: resp.Timestamp.Unix(),
	})
}

// SetGroupAnnounce godoc
// @Summary      Set group announce mode
// @Description  Set whether only admins can send messages
// @Tags         groups
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body body dto.GroupAnnounceRequest true "Announce setting"
// @Success      200 {object} object
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/groups/{groupId}/settings/announce [patch]
func (h *GroupHandler) SetGroupAnnounce(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.GroupAnnounceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	groupID := strings.TrimSuffix(req.GroupID, "@g.us")
	if err := h.whatsappService.SetGroupAnnounce(c.Request.Context(), sessionId, groupID, req.Announce); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

// SetGroupLocked godoc
// @Summary      Set group locked mode
// @Description  Set whether only admins can edit group info
// @Tags         groups
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body body dto.GroupLockedRequest true "Locked setting"
// @Success      200 {object} object
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/groups/{groupId}/settings/locked [patch]
func (h *GroupHandler) SetGroupLocked(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.GroupLockedRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	groupID := strings.TrimSuffix(req.GroupID, "@g.us")
	if err := h.whatsappService.SetGroupLocked(c.Request.Context(), sessionId, groupID, req.Locked); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

// SetGroupPicture godoc
// @Summary      Set group picture
// @Description  Set the group profile picture (supports JSON with base64/URL or multipart/form-data)
// @Tags         groups
// @Accept       json,mpfd
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body body dto.GroupPictureRequest false "Picture data (JSON)"
// @Param        groupId  formData  string  false  "Group ID (form-data)"
// @Param        file  formData  file  false  "Image file (form-data)"
// @Success      200 {object} dto.SetPictureResponse
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/groups/{groupId}/picture [put]
func (h *GroupHandler) SetGroupPicture(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var groupID string
	var imageData []byte
	var ok bool

	if IsMultipartRequest(c) {
		groupID = c.PostForm("groupId")
		if groupID == "" {
			groupID = c.Param("groupId")
		}
		imageData, _, ok = GetMediaFromForm(c, "file")
		if !ok {
			return
		}
	} else {
		var req dto.GroupPictureRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
			return
		}
		groupID = req.GroupID
		imageData, _, ok = GetMediaData(c, req.Image, "image")
		if !ok {
			return
		}
	}

	groupID = strings.TrimSuffix(groupID, "@g.us")
	pictureID, err := h.whatsappService.SetGroupPhoto(c.Request.Context(), sessionId, groupID, imageData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SetPictureResponse{PictureID: pictureID})
}

// DeleteGroupPicture godoc
// @Summary      Delete group picture
// @Description  Remove the group profile picture
// @Tags         groups
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        groupId path string true "Group ID"
// @Success      200 {object} dto.MessageOnlyResponse
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/groups/{groupId}/picture [delete]
func (h *GroupHandler) DeleteGroupPicture(c *gin.Context) {
	sessionId := c.Param("sessionId")
	groupID := c.Param("groupId")

	groupID = strings.TrimSuffix(groupID, "@g.us")
	if err := h.whatsappService.DeleteGroupPhoto(c.Request.Context(), sessionId, groupID); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageOnlyResponse{Message: "group picture deleted"})
}

// SetGroupApprovalMode godoc
// @Summary      Set group join approval mode
// @Description  Set whether join requests need admin approval
// @Tags         groups
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body body dto.GroupApprovalRequest true "Approval setting"
// @Success      200 {object} object
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/groups/{groupId}/settings/approval [patch]
func (h *GroupHandler) SetGroupApprovalMode(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.GroupApprovalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	groupID := strings.TrimSuffix(req.GroupID, "@g.us")
	if err := h.whatsappService.SetGroupJoinApprovalMode(c.Request.Context(), sessionId, groupID, req.ApprovalMode); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

// SetGroupMemberAddMode godoc
// @Summary      Set who can add members
// @Description  Set whether only admins or all members can add participants
// @Tags         groups
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body body dto.GroupMemberAddModeRequest true "Member add mode"
// @Success      200 {object} object
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/groups/{groupId}/settings/memberadd [patch]
func (h *GroupHandler) SetGroupMemberAddMode(c *gin.Context) {
	sessionId := c.Param("sessionId")

	var req dto.GroupMemberAddModeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	var mode types.GroupMemberAddMode
	switch req.Mode {
	case "admin_add":
		mode = types.GroupMemberAddModeAdmin
	case "all_member_add":
		mode = types.GroupMemberAddModeAllMember
	default:
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "mode must be 'admin_add' or 'all_member_add'"})
		return
	}

	groupID := strings.TrimSuffix(req.GroupID, "@g.us")
	if err := h.whatsappService.SetGroupMemberAddMode(c.Request.Context(), sessionId, groupID, mode); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

// GetGroupRequestParticipants godoc
// @Summary      Get pending join requests
// @Description  Get list of pending join requests for a group
// @Tags         groups
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        groupId path string true "Group ID"
// @Success      200 {object} dto.GroupRequestParticipantsResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/groups/{groupId}/requests [get]
func (h *GroupHandler) GetGroupRequestParticipants(c *gin.Context) {
	sessionId := c.Param("sessionId")
	groupID := strings.TrimSuffix(c.Param("groupId"), "@g.us")

	requests, err := h.whatsappService.GetGroupRequestParticipants(c.Request.Context(), sessionId, groupID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupRequestParticipantsResponse{
		GroupID:      groupID,
		Participants: requests,
	})
}

// UpdateGroupRequestParticipants godoc
// @Summary      Approve or reject join requests
// @Description  Approve or reject pending join requests
// @Tags         groups
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        groupId path string true "Group ID"
// @Param        body body dto.GroupRequestActionBodyRequest true "Action data"
// @Success      200 {object} dto.GroupActionResponse
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/groups/{groupId}/requests [post]
func (h *GroupHandler) UpdateGroupRequestParticipants(c *gin.Context) {
	sessionId := c.Param("sessionId")
	groupID := strings.TrimSuffix(c.Param("groupId"), "@g.us")

	var req dto.GroupRequestActionBodyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	var action whatsmeow.ParticipantRequestChange
	switch req.Action {
	case "approve":
		action = whatsmeow.ParticipantChangeApprove
	case "reject":
		action = whatsmeow.ParticipantChangeReject
	default:
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "action must be 'approve' or 'reject'"})
		return
	}

	result, err := h.whatsappService.UpdateGroupRequestParticipants(c.Request.Context(), sessionId, groupID, req.Participants, action)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{

		GroupID: groupID,
		Data:    result,
	})
}

// GetGroupInfoFromLink godoc
// @Summary      Get group info from invite link
// @Description  Get group information using an invite link
// @Tags         groups
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        link query string true "Invite link or code"
// @Success      200 {object} dto.GroupActionResponse
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     ApiKeyAuth
// @Router       /sessions/{sessionId}/groups/info/link [get]
func (h *GroupHandler) GetGroupInfoFromLink(c *gin.Context) {
	sessionId := c.Param("sessionId")

	link := c.Query("link")
	if link == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "link query parameter is required"})
		return
	}

	// Extract code from link
	code := link
	if strings.Contains(code, "chat.whatsapp.com/") {
		parts := strings.Split(code, "chat.whatsapp.com/")
		if len(parts) > 1 {
			code = parts[1]
		}
	}

	info, err := h.whatsappService.GetGroupInfoFromLink(c.Request.Context(), sessionId, code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{

		GroupID: info.JID.String(),
		Data:    info,
	})
}
