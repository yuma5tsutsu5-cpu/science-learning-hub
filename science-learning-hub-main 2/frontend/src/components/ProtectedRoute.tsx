import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

function ProtectedRoute() {
  const { authenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="status-message">認証状態を確認しています...</p>;
  if (!authenticated) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export default ProtectedRoute;
