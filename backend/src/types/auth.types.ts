// Authentication Types
// Define JWT payload structure and auth-related interfaces

import { UserRole } from '@prisma/client';

// JWT Payload structure
export interface JWTPayload {
  userId: string;
  email: string;
  globalRole: UserRole;
  tenantId?: string; // Optional: for tenant-scoped operations
  tenantRole?: UserRole; // Optional: role within the specific tenant
}

// Access Token Payload
export interface AccessTokenPayload extends JWTPayload {
  type: 'access';
}

// Refresh Token Payload
export interface RefreshTokenPayload {
  userId: string;
  type: 'refresh';
}

// Auth Response
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    globalRole: UserRole;
  };
  tenant?: {
    id: string;
    name: string;
    slug: string;
    role: UserRole;
  };
}

// Login Request
export interface LoginRequest {
  email: string;
  password: string;
  tenantId?: string; // Optional: login to specific tenant context
}

// Register Request
export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

// Refresh Token Request
export interface RefreshTokenRequest {
  refreshToken: string;
}