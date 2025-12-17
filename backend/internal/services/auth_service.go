package services

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/seu-usuario/onwapp/internal/models"
	"github.com/seu-usuario/onwapp/internal/db/repository"
	"github.com/seu-usuario/onwapp/pkg/hash"
	"github.com/seu-usuario/onwapp/pkg/jwt"
)

type AuthService struct {
	userRepo      *repository.UserRepository
	tenantRepo    *repository.TenantRepository
	jwtSecret     string
	jwtExpiration time.Duration
}

func NewAuthService(db *pgx.Conn, jwtSecret string, jwtExpiration time.Duration) *AuthService {
	return &AuthService{
		userRepo:      repository.NewUserRepository(db),
		tenantRepo:    repository.NewTenantRepository(db),
		jwtSecret:     jwtSecret,
		jwtExpiration: jwtExpiration,
	}
}

func (s *AuthService) Register(ctx context.Context, req *models.CreateUserRequest, tenantID uuid.UUID) (*models.User, error) {
	// Check if user already exists
	existingUser, _ := s.userRepo.FindByEmail(ctx, req.Email)
	if existingUser != nil {
		return nil, errors.New("user already exists")
	}

	// Hash password
	hashedPassword, err := hash.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	// Create user
	user := &models.User{
		ID:           uuid.New(),
		TenantID:     tenantID,
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: hashedPassword,
		Role:         req.Role,
		Online:       false,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AuthService) Login(ctx context.Context, email, password string) (*models.User, string, error) {
	// Find user by email
	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return nil, "", errors.New("invalid credentials")
	}

	// Check password
	if !hash.CheckPasswordHash(password, user.PasswordHash) {
		return nil, "", errors.New("invalid credentials")
	}

	// Generate JWT token
	token, err := jwt.GenerateToken(s.jwtSecret, user.ID, user.TenantID, user.Role, s.jwtExpiration)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

func (s *AuthService) ValidateToken(tokenString string) (*jwt.Claims, error) {
	return jwt.ParseToken(tokenString, s.jwtSecret)
}
