import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, Role } from "./AuthContext";
import { validateAuth } from "./AuthHelpers";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, userRole } = useAuth();
  const location = useLocation();
  const [isTokenValid, setIsTokenValid] = useState(true);

  // Validate token on component mount and route change
  useEffect(() => {
    const checkToken = () => {
      const isValid = validateAuth();
      setIsTokenValid(isValid);
    };
    
    checkToken();
  }, [location.pathname]);

  // If token is invalid or user is not authenticated, redirect to login
  if (!isAuthenticated || !isTokenValid) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Only redirect if we're at the root path - this prevents infinite redirects
  if (location.pathname === "/") {
    if (userRole === Role.ADMIN) {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === Role.CHEF) {
      return <Navigate to="/chef" replace />;
    } else if (userRole === Role.WAITER) {
      return <Navigate to="/waiter" replace />;
    } else if (userRole === Role.POS_ADMIN) {
      return <Navigate to="/posAdmin/pos" replace />;
    } else {
      return <Navigate to="/menu" replace />;
    }
  }

  return <>{children}</>;
}

interface GuestGuardProps {
  children: ReactNode;
}

export function GuestGuard({ children }: GuestGuardProps) {
  const { isAuthenticated, userRole } = useAuth();
  const location = useLocation();
  const [isTokenValid, setIsTokenValid] = useState(true);
  
  // Validate token on component mount
  useEffect(() => {
    const checkToken = () => {
      const isValid = validateAuth();
      setIsTokenValid(isValid);
    };
    
    if (isAuthenticated) {
      checkToken();
    }
  }, [isAuthenticated]);
  
  // Special case: allow authenticated users without a role to access the newUser and login pages
  if ((location.pathname === "/newUser" || location.pathname === "/login") && isAuthenticated && userRole === null) {
    return <>{children}</>;
  }
  
  // If trying to access guest routes (login/signup) while authenticated with valid token, redirect to appropriate dashboard
  if (isAuthenticated && isTokenValid) {
    if (userRole === Role.ADMIN) {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === Role.CHEF) {
      return <Navigate to="/chef" replace />;
    } else if (userRole === Role.WAITER) {
      return <Navigate to="/waiter" replace />;
    } else if (userRole === Role.POS_ADMIN) {
      return <Navigate to="/posAdmin/pos" replace />;
    } 
    else if(userRole == null && location.pathname !== "/login") {
      return <Navigate to="/newUser" replace />
    }
    else {
      return <Navigate to="/menu" replace />;
    }
  }

  return <>{children}</>;
} 