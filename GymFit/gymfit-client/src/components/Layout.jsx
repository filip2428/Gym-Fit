import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";

/** Standard layout for public + user/trainer pages: top navbar over a centered container. */
export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
