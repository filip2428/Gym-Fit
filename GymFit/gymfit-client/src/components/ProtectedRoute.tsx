import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { dashboardPathForRole } from "@/lib/auth";
import type { Role } from "@/types/api";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  children: ReactNode;
}

/**
 * Guards a route. Redirects to /login when unauthenticated, and to the user's
 * own dashboard when their role is not in `allowedRoles`.
 */
export default function ProtectedRoute({
  allowedRoles,
  children,
}: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role as Role)) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }

  return <>{children}</>;
}
