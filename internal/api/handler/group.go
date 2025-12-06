package handler

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types"

	"onwapp/internal/api/dto"
	"onwapp/internal/service/wpp"
)

type GroupHandler struct {
	wpp *wpp.Service
}

func NewGroupHandler(wpp *wpp.Service) *GroupHandler {
	return &GroupHandler{wpp: wpp}
}

// CreateGroup godoc
// @Summary      Create a new group
// @Description  Create a new WhatsApp group with participants
// @Tags         group
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.CreateGroupRequest  true  "Group data"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/group/create [post]
func (h *GroupHandler) CreateGroup(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.CreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	info, err := h.wpp.CreateGroup(c.Request.Context(), sessionId, req.Name, req.Participants)
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
// @Tags         group
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        groupId  query      string  true  "Group ID"
// @Success      200      {object}  dto.GroupActionResponse
// @Failure      400      {object}  dto.ErrorResponse
// @Failure      401      {object}  dto.ErrorResponse
// @Failure      500      {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/group/info [get]
func (h *GroupHandler) GetGroupInfo(c *gin.Context) {
	sessionId := c.Param("session")
	groupID := c.Query("groupId")
	if groupID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "groupId query parameter is required"})
		return
	}

	info, err := h.wpp.GetGroupInfo(c.Request.Context(), sessionId, groupID)
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
// @Tags         group
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/group/list [get]
func (h *GroupHandler) GetJoinedGroups(c *gin.Context) {
	sessionId := c.Param("session")

	groups, err := h.wpp.GetJoinedGroups(c.Request.Context(), sessionId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	// Convert to DTO with proper JSON field names (lowercase)
	items := make([]dto.GroupListItem, len(groups))
	for i, g := range groups {
		items[i] = dto.GroupListItem{
			JID:              g.JID.String(),
			Name:             g.Name,
			Topic:            g.Topic,
			ParticipantCount: len(g.Participants),
			IsAnnounce:       g.IsAnnounce,
			IsLocked:         g.IsLocked,
			CreatedAt:        g.GroupCreated.Unix(),
		}
	}

	c.JSON(http.StatusOK, dto.GroupListResponse{Data: items})
}

// LeaveGroup godoc
// @Summary      Leave group
// @Description  Leave a WhatsApp group
// @Tags         group
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        groupId  query      string  true  "Group ID"
// @Success      200      {object}  dto.GroupActionResponse
// @Failure      401      {object}  dto.ErrorResponse
// @Failure      500      {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/group/leave [post]
func (h *GroupHandler) LeaveGroup(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.GroupIDRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.wpp.LeaveGroup(c.Request.Context(), sessionId, req.GroupID); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{
		GroupID: req.GroupID,
	})
}

// UpdateGroupName godoc
// @Summary      Update group name
// @Description  Update the name of a WhatsApp group
// @Tags         group
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.GroupUpdateRequest  true  "New name"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/group/name [patch]
func (h *GroupHandler) UpdateGroupName(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.GroupUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.wpp.SetGroupName(c.Request.Context(), sessionId, req.GroupID, req.Value); err != nil {
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
// @Tags         group
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.GroupUpdateRequest  true  "New description"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/group/topic [patch]
func (h *GroupHandler) UpdateGroupTopic(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.GroupUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.wpp.SetGroupTopic(c.Request.Context(), sessionId, req.GroupID, req.Value); err != nil {
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
// @Tags         group
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.GroupParticipantsRequest  true  "Participants"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/group/participants/add [post]
func (h *GroupHandler) AddParticipants(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.GroupParticipantsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	result, err := h.wpp.AddParticipants(c.Request.Context(), sessionId, req.GroupID, req.Participants)
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
// @Tags         group
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.GroupParticipantsRequest  true  "Participants"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/group/participants/remove [post]
func (h *GroupHandler) RemoveParticipants(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.GroupParticipantsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	result, err := h.wpp.RemoveParticipants(c.Request.Context(), sessionId, req.GroupID, req.Participants)
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
// @Tags         group
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.GroupParticipantsRequest  true  "Participants"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/group/participants/promote [patch]
func (h *GroupHandler) PromoteParticipants(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.GroupParticipantsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	result, err := h.wpp.PromoteParticipants(c.Request.Context(), sessionId, req.GroupID, req.Participants)
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
// @Tags         group
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.GroupParticipantsRequest  true  "Participants"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/group/participants/demote [patch]
func (h *GroupHandler) DemoteParticipants(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.GroupParticipantsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	result, err := h.wpp.DemoteParticipants(c.Request.Context(), sessionId, req.GroupID, req.Participants)
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
// @Tags         group
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        groupId  query      string  true   "Group ID"
// @Param        reset    query     bool    false  "Reset link"
// @Success      200      {object}  dto.GroupInviteLinkResponse
// @Failure      401      {object}  dto.ErrorResponse
// @Failure      500      {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/group/invitelink [get]
func (h *GroupHandler) GetInviteLink(c *gin.Context) {
	sessionId := c.Param("session")
	groupID := c.Query("groupId")
	if groupID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "groupId query parameter is required"})
		return
	}
	reset := c.Query("reset") == "true"

	link, err := h.wpp.GetInviteLink(c.Request.Context(), sessionId, groupID, reset)
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
// @Tags         group
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.JoinGroupRequest  true  "Invite link"
// @Success      200    {object}  dto.GroupActionResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/group/join [post]
func (h *GroupHandler) JoinGroup(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.JoinGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	jid, err := h.wpp.JoinWithLink(c.Request.Context(), sessionId, req.InviteLink)
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
// @Tags         group
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.SendGroupMessageRequest  true  "Message data"
// @Success      200    {object}  dto.SendResponse
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      401    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/group/send/text [post]
func (h *GroupHandler) SendGroupMessage(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.SendGroupMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.wpp.SendText(c.Request.Context(), sessionId, req.GroupID, req.Text)
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
// @Tags         group
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body body dto.GroupAnnounceRequest true "Announce setting"
// @Success      200 {object} object
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/group/announce [patch]
func (h *GroupHandler) SetGroupAnnounce(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.GroupAnnounceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	groupID := strings.TrimSuffix(req.GroupID, "@g.us")
	if err := h.wpp.SetGroupAnnounce(c.Request.Context(), sessionId, groupID, req.Announce); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

// SetGroupLocked godoc
// @Summary      Set group locked mode
// @Description  Set whether only admins can edit group info
// @Tags         group
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body body dto.GroupLockedRequest true "Locked setting"
// @Success      200 {object} object
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/group/locked [patch]
func (h *GroupHandler) SetGroupLocked(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.GroupLockedRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	groupID := strings.TrimSuffix(req.GroupID, "@g.us")
	if err := h.wpp.SetGroupLocked(c.Request.Context(), sessionId, groupID, req.Locked); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

// SetGroupPicture godoc
// @Summary      Set group picture
// @Description  Set the group profile picture (supports JSON with base64/URL or multipart/form-data)
// @Tags         group
// @Accept       json,mpfd
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body body dto.GroupPictureRequest false "Picture data (JSON)"
// @Param        groupId  formData  string  false  "Group ID (form-data)"
// @Param        file  formData  file  false  "Image file (form-data)"
// @Success      200 {object} dto.SetPictureResponse
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/group/photo [post]
func (h *GroupHandler) SetGroupPicture(c *gin.Context) {
	sessionId := c.Param("session")

	var groupID string
	var imageData []byte
	var ok bool

	if IsMultipartRequest(c) {
		groupID = c.PostForm("groupId")
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
	pictureID, err := h.wpp.SetGroupPhoto(c.Request.Context(), sessionId, groupID, imageData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SetPictureResponse{PictureID: pictureID})
}

// DeleteGroupPicture godoc
// @Summary      Delete group picture
// @Description  Remove the group profile picture
// @Tags         group
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        groupId path string true "Group ID"
// @Success      200 {object} dto.MessageOnlyResponse
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/group/photo/remove [post]
func (h *GroupHandler) DeleteGroupPicture(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.GroupIDRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	groupID := strings.TrimSuffix(req.GroupID, "@g.us")
	if err := h.wpp.DeleteGroupPhoto(c.Request.Context(), sessionId, groupID); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MessageOnlyResponse{Message: "group picture deleted"})
}

// GetGroupPicture godoc
// @Summary      Get group picture
// @Description  Get group profile picture URL
// @Tags         group
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        groupId   query     string  true  "Group ID"
// @Success      200 {object} dto.AvatarResponse
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/group/avatar [get]
func (h *GroupHandler) GetGroupPicture(c *gin.Context) {
	sessionId := c.Param("session")
	groupID := c.Query("groupId")
	if groupID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "groupId query parameter is required"})
		return
	}

	groupID = strings.TrimSuffix(groupID, "@g.us")
	pic, err := h.wpp.GetGroupPicture(c.Request.Context(), sessionId, groupID)
	if err != nil || pic == nil {
		// Group might not have a profile picture - return empty URL instead of error
		c.JSON(http.StatusOK, dto.AvatarResponse{URL: ""})
		return
	}

	c.JSON(http.StatusOK, dto.AvatarResponse{URL: pic.URL, ID: pic.ID})
}

// SetGroupApprovalMode godoc
// @Summary      Set group join approval mode
// @Description  Set whether join requests need admin approval
// @Tags         group
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body body dto.GroupApprovalRequest true "Approval setting"
// @Success      200 {object} object
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/group/approval [patch]
func (h *GroupHandler) SetGroupApprovalMode(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.GroupApprovalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	groupID := strings.TrimSuffix(req.GroupID, "@g.us")
	if err := h.wpp.SetJoinApprovalMode(c.Request.Context(), sessionId, groupID, req.ApprovalMode); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

// SetGroupMemberAddMode godoc
// @Summary      Set who can add members
// @Description  Set whether only admins or all members can add participants
// @Tags         group
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body body dto.GroupMemberAddModeRequest true "Member add mode"
// @Success      200 {object} object
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/group/memberadd [patch]
func (h *GroupHandler) SetGroupMemberAddMode(c *gin.Context) {
	sessionId := c.Param("session")

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
	if err := h.wpp.SetMemberAddMode(c.Request.Context(), sessionId, groupID, mode); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

// GetGroupRequestParticipants godoc
// @Summary      Get pending join requests
// @Description  Get list of pending join requests for a group
// @Tags         group
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        groupId path string true "Group ID"
// @Success      200 {object} dto.GroupRequestParticipantsResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/group/requests [get]
func (h *GroupHandler) GetGroupRequestParticipants(c *gin.Context) {
	sessionId := c.Param("session")
	groupID := c.Query("groupId")
	if groupID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "groupId query parameter is required"})
		return
	}

	groupID = strings.TrimSuffix(groupID, "@g.us")
	requests, err := h.wpp.GetJoinRequests(c.Request.Context(), sessionId, groupID)
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
// @Tags         group
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        groupId path string true "Group ID"
// @Param        body body dto.GroupRequestActionBodyRequest true "Action data"
// @Success      200 {object} dto.GroupActionResponse
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/group/requests/action [post]
func (h *GroupHandler) UpdateGroupRequestParticipants(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.GroupRequestActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	groupID := strings.TrimSuffix(req.GroupID, "@g.us")

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

	result, err := h.wpp.UpdateJoinRequests(c.Request.Context(), sessionId, groupID, req.Participants, action)
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
// @Tags         group
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        link query string true "Invite link or code"
// @Success      200 {object} dto.GroupActionResponse
// @Failure      400 {object} dto.ErrorResponse
// @Failure      500 {object} dto.ErrorResponse
// @Security     Authorization
// @Router       /{session}/group/inviteinfo [get]
func (h *GroupHandler) GetGroupInfoFromLink(c *gin.Context) {
	sessionId := c.Param("session")

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

	info, err := h.wpp.GetGroupInfoFromLink(c.Request.Context(), sessionId, code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.GroupActionResponse{

		GroupID: info.JID.String(),
		Data:    info,
	})
}
