import { Link, NavLink, useNavigate } from "react-router-dom";
import { Dumbbell, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { dashboardPathForRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    cn(
      "text-sm font-medium transition-colors hover:text-primary",
      isActive ? "text-primary" : "text-muted-foreground"
    );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <Dumbbell className="h-6 w-6 text-primary" />
          <span>GymFit</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/trainers" className={linkClass}>
            Trainers
          </NavLink>
          {user?.role === "user" && (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/classes" className={linkClass}>
                Classes
              </NavLink>
              <NavLink to="/my-qr" className={linkClass}>
                My QR
              </NavLink>
            </>
          )}
          {user?.role === "trainer" && (
            <NavLink to="/trainer-dashboard" className={linkClass}>
              My Classes
            </NavLink>
          )}
          {user?.role === "admin" && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to={dashboardPathForRole(user.role)}
                className="hidden items-center gap-2 sm:flex"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {initials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{user.fullName}</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
