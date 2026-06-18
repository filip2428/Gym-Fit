import { jwtDecode } from "jwt-decode";

const TOKEN_KEY = "gymfit_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Decode the stored JWT into a normalized user object, or null if missing/expired.
 * Reads the custom claims emitted by the backend (userId, email, role, fullName).
 */
export function getUserFromToken(token = getToken()) {
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);

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
      userId,
      email,
      role,
      fullName: decoded.fullName || "",
    };
  } catch {
    return null;
  }
}

/** Default landing route for a given role. */
export function dashboardPathForRole(role) {
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
