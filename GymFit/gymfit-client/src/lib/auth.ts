import { jwtDecode, type JwtPayload } from "jwt-decode";
import type { AuthUser } from "@/types/api";

const TOKEN_KEY = "gymfit_token";

/** The custom claims the backend emits, plus the legacy schema-URI fallbacks. */
interface GymFitJwtClaims extends JwtPayload {
  role?: string;
  userId?: string;
  email?: string;
  fullName?: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"?: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Decode the stored JWT into a normalized user object, or null if missing/expired.
 * Reads the custom claims emitted by the backend (userId, email, role, fullName).
 */
export function getUserFromToken(token: string | null = getToken()): AuthUser | null {
  if (!token) return null;
  try {
    const decoded = jwtDecode<GymFitJwtClaims>(token);

    // Token expiry check.
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null;
    }

    const role =
      decoded.role ||
      decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    const userId =
      decoded.userId ||
      decoded.sub ||
      decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
    const email =
      decoded.email ||
      decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];

    return {
      userId: userId ?? "",
      email: email ?? "",
      role: role ?? "",
      fullName: decoded.fullName || "",
    };
  } catch {
    return null;
  }
}

/** Default landing route for a given role. */
export function dashboardPathForRole(role: string | undefined): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "trainer":
      return "/trainer-dashboard";
    case "user":
    default:
      return "/dashboard";
  }
}
