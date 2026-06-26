/**
 * Shared API contract types.
 *
 * These mirror the backend DTOs in `GymFit.API/DTOs/*.cs`. JSON mapping:
 *   C# Guid     -> string
 *   C# DateTime -> string (ISO 8601)
 *   C# T?       -> T | null
 */

export type Role = "user" | "trainer" | "admin";

/** Normalized shape decoded from the JWT (see src/lib/auth.ts). */
export interface AuthUser {
  userId: string;
  email: string;
  role: Role | string;
  fullName: string;
}

// --- Auth (AuthDtos.cs) ---

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  fullName: string;
  role: string;
}

// --- Classes (ClassDtos.cs) ---

export interface TrainerSummary {
  id: string;
  fullName: string;
}

export interface ClassListItem {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  scheduledAt: string;
  durationMinutes: number;
  enrolledCount: number;
  trainers: TrainerSummary[];
}

export interface ClassDetailResponse {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  scheduledAt: string;
  durationMinutes: number;
  enrolledCount: number;
  isFull: boolean;
  trainers: TrainerSummary[];
}

export interface CreateClassRequest {
  name: string;
  description: string | null;
  capacity: number;
  scheduledAt: string;
  durationMinutes: number;
  trainerIds: string[];
}

export type UpdateClassRequest = CreateClassRequest;

// --- Trainers (TrainerDtos.cs) ---

export interface TrainerListItem {
  id: string;
  fullName: string;
  bio: string | null;
  phone: string | null;
  photoUrl: string | null;
}

export interface TrainerClassItem {
  id: string;
  name: string;
  scheduledAt: string;
  durationMinutes: number;
  capacity: number;
  enrolledCount: number;
}

export interface TrainerDetailResponse {
  id: string;
  fullName: string;
  bio: string | null;
  phone: string | null;
  photoUrl: string | null;
  upcomingClasses: TrainerClassItem[];
}

export interface CreateTrainerRequest {
  fullName: string;
  email: string;
  password: string;
  bio: string | null;
  phone: string | null;
}

export interface UpdateTrainerRequest {
  bio: string | null;
  phone: string | null;
}

export interface EnrolledStudent {
  userId: string;
  fullName: string;
  email: string;
  enrolledAt: string;
}

// --- Users (UserDtos.cs) ---

export interface MemberListItem {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  activatedAt: string | null;
  expiresAt: string | null;
  isExpired: boolean;
}

// --- Membership (MembershipDtos.cs) ---

export interface ActivateMembershipRequest {
  userId: string;
  durationDays: number;
}

export interface MembershipStatusResponse {
  isActive: boolean;
  activatedAt: string | null;
  expiresAt: string | null;
  isExpired: boolean;
}

// --- QR (QrDtos.cs) ---

export interface QrCodeResponse {
  userId: string;
  qrCodeBase64: string;
}

export interface QrValidationResponse {
  fullName: string;
  email: string;
  isActive: boolean;
  activatedAt: string | null;
  expiresAt: string | null;
  isExpired: boolean;
}

// --- Generic (MessageResponse.cs) ---

export interface MessageResponse {
  message: string;
}
