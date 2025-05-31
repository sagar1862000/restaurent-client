import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { authApi } from "./api/user";
import { toast } from "sonner";
import { validateAuth } from "./AuthHelpers";

interface WaiterGuardProps {
  children: ReactNode;
}

export function WaiterGuard({ children }: WaiterGuardProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isWaiter, setIsWaiter] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(true);

  useEffect(() => {
    async function checkWaiterStatus() {
      // First validate the token
      const tokenValid = validateAuth();
      setIsTokenValid(tokenValid);
      
      if (!isAuthenticated || !tokenValid) {
        setLoading(false);
        return;
      }

      try {
        // Get the current user's information
        const userData = await authApi.getMe();
        
        // Check if user has waiter or admin role based on roleName
        setIsWaiter(userData.roleName === "waiter" || userData.roleName === "admin");
        setLoading(false);
      } catch (error) {
        console.error("Error checking waiter status:", error);
        toast.error("Failed to verify your permissions");
        setLoading(false);
      }
    }

    checkWaiterStatus();
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isTokenValid) {
    // Redirect to login but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isWaiter) {
    // Redirect to home if authenticated but not a waiter
    toast.error("You don't have waiter permissions");
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
} 