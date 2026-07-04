import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { LoadingSkeleton } from "../components/LoadingSkeleton";

export function ProtectedRoute() {
  const { currentUser, businessProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSkeleton label="Loading secure workspace" />;
  if (!currentUser) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!businessProfile && location.pathname !== "/business-setup") {
    return <Navigate to="/business-setup" replace />;
  }

  return <Outlet />;
}
