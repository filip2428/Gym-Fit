import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Dumbbell,
  CalendarDays,
  ScanLine,
  LogOut,
  Menu,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import MembersTab from "./MembersTab";
import TrainersTab from "./TrainersTab";
import ClassesTab from "./ClassesTab";
import QrScannerTab from "./QrScannerTab";

const SECTIONS = [
  { id: "members", label: "Members", icon: Users, Component: MembersTab },
  { id: "trainers", label: "Trainers", icon: Dumbbell, Component: TrainersTab },
  { id: "classes", label: "Classes", icon: CalendarDays, Component: ClassesTab },
  { id: "scanner", label: "QR Scanner", icon: ScanLine, Component: QrScannerTab },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState("members");
  const [mobileOpen, setMobileOpen] = useState(false);

  const ActiveComponent =
    SECTIONS.find((s) => s.id === active)?.Component ?? MembersTab;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const NavItems = () => (
    <nav className="space-y-1">
      {SECTIONS.map((s) => {
        const Icon = s.icon;
        return (
          <button
            key={s.id}
            onClick={() => {
              setActive(s.id);
              setMobileOpen(false);
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active === s.id
                ? "bg-primary text-primary-foreground"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" />
            {s.label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 p-4 text-white md:flex">
        <div className="flex items-center gap-2 px-2 pb-6 pt-2">
          <Dumbbell className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">GymFit Admin</span>
        </div>
        <NavItems />
        <div className="mt-auto space-y-3 pt-6">
          <div className="px-3 text-xs text-slate-400">
            Signed in as
            <div className="truncate font-medium text-slate-200">
              {user?.fullName}
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b bg-slate-900 p-4 text-white md:hidden">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <span className="font-bold">GymFit Admin</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        {mobileOpen && (
          <div className="border-b bg-slate-900 p-4 text-white md:hidden">
            <NavItems />
            <Button
              variant="ghost"
              className="mt-3 w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" /> Log out
            </Button>
          </div>
        )}

        <main className="flex-1 overflow-x-hidden p-4 md:p-8">
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
}
