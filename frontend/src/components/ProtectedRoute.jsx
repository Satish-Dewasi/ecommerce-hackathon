import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * Wraps a route and redirects if:
 * - Not logged in → /auth
 * - Logged in but wrong role → /
 *
 * Usage:
 *   <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
 *   <ProtectedRoute role="seller"><SellerDashboard /></ProtectedRoute>
 */
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (role && user.role !== role) return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute;