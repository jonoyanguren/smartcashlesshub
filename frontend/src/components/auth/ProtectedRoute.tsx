import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePasswordChange?: boolean; // Default true - redirect if mustChangePassword is true
}

const ProtectedRoute = ({ children, requirePasswordChange = true }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(true);

  useEffect(() => {
    // Check if user needs to change password
    const checkPasswordStatus = async () => {
      if (!isAuthenticated || !user) {
        setCheckingPassword(false);
        return;
      }

      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('http://localhost:3001/api/v1/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMustChangePassword(data.data.mustChangePassword || false);
        }
      } catch (error) {
        console.error('Error checking password status:', error);
      } finally {
        setCheckingPassword(false);
      }
    };

    checkPasswordStatus();
  }, [isAuthenticated, user]);

  if (isLoading || checkingPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent-200 border-t-accent-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user must change password and we require it, redirect to change-password page
  if (requirePasswordChange && mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
