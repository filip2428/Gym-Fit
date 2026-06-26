import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { dashboardPathForRole } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import TrainersList from "@/pages/TrainersList";
import TrainerProfile from "@/pages/TrainerProfile";
import Dashboard from "@/pages/Dashboard";
import Classes from "@/pages/Classes";
import MyQr from "@/pages/MyQr";
import TrainerDashboard from "@/pages/TrainerDashboard";
import AdminLayout from "@/pages/admin/AdminLayout";

/** Sends the user to their role's dashboard, or to the trainers page if logged out. */
function HomeRedirect() {
  const { user } = useAuth();
  if (user) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }
  return <Navigate to="/trainers" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Standalone */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Pages with the public/user navbar layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/trainers" element={<TrainersList />} />
            <Route path="/trainers/:id" element={<TrainerProfile />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/classes"
              element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <Classes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-qr"
              element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <MyQr />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trainer-dashboard"
              element={
                <ProtectedRoute allowedRoles={["trainer"]}>
                  <TrainerDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Admin has its own full-screen sidebar layout */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
