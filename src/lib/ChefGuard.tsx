import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { authApi } from "./api/user";
import { toast } from "sonner";

interface ChefGuardProps {
  children: ReactNode;
}

export function ChefGuard({ children }: ChefGuardProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isChef, setIsChef] = useState(false);

  useEffect(() => {
    async function checkChefStatus() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        // Get the current user's information
        const userData = await authApi.getMe();
        
        // Check if user has chef or admin role based on roleName
        setIsChef(userData.roleName === "chef" || userData.roleName === "admin");
        setLoading(false);
      } catch (error) {
        console.error("Error checking chef status:", error);
        toast.error("Failed to verify your permissions");
        setLoading(false);
      }
    }

    checkChefStatus();
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isChef) {
    // Redirect to home if authenticated but not a chef
    toast.error("You don't have chef permissions");
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
} 