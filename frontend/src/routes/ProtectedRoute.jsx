import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, initialized } = useAuth();
  const location = useLocation();

  // Wait for auth to be fully initialized from localStorage
  if (!initialized || loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  // Determine where to redirect based on the current path
  const isAdminRoute = location.pathname.startsWith("/admin");
  const loginPath = isAdminRoute ? "/admin/login" : "/login";

  if (!user) {
    return <Navigate to={loginPath} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={loginPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
