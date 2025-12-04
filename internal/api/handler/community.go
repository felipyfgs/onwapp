package handler

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"zpwoot/internal/api/dto"
	"zpwoot/internal/service/wpp"
)

type CommunityHandler struct {
	wpp *wpp.Service
}

func NewCommunityHandler(wpp *wpp.Service) *CommunityHandler {
	return &CommunityHandler{wpp: wpp}
}

// LinkGroup godoc
// @Summary      Link group to community
// @Description  Link a group to a community as a subgroup
// @Tags         community
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.LinkGroupRequest true  "Link data"
// @Success      200    {object}  object
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /sessions/{sessionId}/communities/{communityId}/groups [post]
func (h *CommunityHandler) LinkGroup(c *gin.Context) {
	sessionId := c.Param("sessionId")

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

// UnlinkGroup godoc
// @Summary      Unlink group from community
// @Description  Unlink a group from a community
// @Tags         community
// @Accept       json
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        body   body      dto.LinkGroupRequest true  "Unlink data"
// @Success      200    {object}  object
// @Failure      400    {object}  dto.ErrorResponse
// @Failure      500    {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /sessions/{sessionId}/communities/{communityId}/groups/{groupId} [delete]
func (h *CommunityHandler) UnlinkGroup(c *gin.Context) {
	sessionId := c.Param("sessionId")

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

// GetSubGroups godoc
// @Summary      Get community subgroups
// @Description  Get list of subgroups in a community
// @Tags         community
// @Produce      json
// @Param        sessionId   path      string  true  "Session ID"
// @Param        communityId  path      string  true  "Community ID"
// @Success      200          {object}  dto.CommunityResponse
// @Failure      500          {object}  dto.ErrorResponse
// @Security     Authorization
// @Router       /sessions/{sessionId}/communities/{communityId}/groups [get]
func (h *CommunityHandler) GetSubGroups(c *gin.Context) {
	sessionId := c.Param("sessionId")
	communityID := strings.TrimSuffix(c.Param("communityId"), "@g.us")

	groups, err := h.wpp.GetSubGroups(c.Request.Context(), sessionId, communityID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.CommunityResponse{

		Groups: groups,
	})
}
