package handler

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"onwapp/internal/api/dto"
	"onwapp/internal/service/wpp"
)

type CommunityHandler struct {
	wpp *wpp.Service
}

func NewCommunityHandler(wpp *wpp.Service) *CommunityHandler {
	return &CommunityHandler{wpp: wpp}
}

// @Summary      Link group to community
// @Description  Link a group to a community as a subgroup. Both group IDs must be without @g.us suffix.
// @Tags         community
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.LinkGroupRequest true  "Parent and child group IDs"
// @Success      200    {object}  object  "Group linked successfully"
// @Failure      400    {object}  dto.ErrorResponse  "Invalid group IDs"
// @Failure      404    {object}  dto.ErrorResponse  "Session not found"
// @Failure      500    {object}  dto.ErrorResponse  "Failed to link group"
// @Security     Authorization
// @Router       /{session}/community/link [post]
func (h *CommunityHandler) LinkGroup(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.LinkGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	parentID := strings.TrimSuffix(req.ParentGroupID, "@g.us")
	childID := strings.TrimSuffix(req.ChildGroupID, "@g.us")

	if err := h.wpp.LinkGroup(c.Request.Context(), sessionId, parentID, childID); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

// @Summary      Unlink group from community
// @Description  Unlink a group from a community. Both group IDs must be without @g.us suffix.
// @Tags         community
// @Accept       json
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        body   body      dto.LinkGroupRequest true  "Parent and child group IDs"
// @Success      200    {object}  object  "Group unlinked successfully"
// @Failure      400    {object}  dto.ErrorResponse  "Invalid group IDs"
// @Failure      404    {object}  dto.ErrorResponse  "Session not found"
// @Failure      500    {object}  dto.ErrorResponse  "Failed to unlink group"
// @Security     Authorization
// @Router       /{session}/community/unlink [post]
func (h *CommunityHandler) UnlinkGroup(c *gin.Context) {
	sessionId := c.Param("session")

	var req dto.LinkGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	parentID := strings.TrimSuffix(req.ParentGroupID, "@g.us")
	childID := strings.TrimSuffix(req.ChildGroupID, "@g.us")

	if err := h.wpp.UnlinkGroup(c.Request.Context(), sessionId, parentID, childID); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

// @Summary      Get community subgroups
// @Description  Get list of subgroups in a community
// @Tags         community
// @Produce      json
// @Param        session   path      string  true  "Session ID"
// @Param        communityId  query      string  true  "Community ID (without @g.us suffix)"
// @Success      200          {object}  dto.CommunityResponse  "List of subgroups"
// @Failure      400          {object}  dto.ErrorResponse  "Missing communityId parameter"
// @Failure      404          {object}  dto.ErrorResponse  "Session not found"
// @Failure      500          {object}  dto.ErrorResponse  "Failed to get subgroups"
// @Security     Authorization
// @Router       /{session}/community/groups [get]
func (h *CommunityHandler) GetSubGroups(c *gin.Context) {
	sessionId := c.Param("session")
	communityID := c.Query("communityId")
	if communityID == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "communityId query parameter is required"})
		return
	}

	communityID = strings.TrimSuffix(communityID, "@g.us")
	groups, err := h.wpp.GetSubGroups(c.Request.Context(), sessionId, communityID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"groups": groups,
	})
}
