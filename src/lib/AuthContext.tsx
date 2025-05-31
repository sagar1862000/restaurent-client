import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { logout, isTokenExpired } from "./AuthHelpers";

// Define the Role enum to match server-side
export enum Role {
  ADMIN = 0,
  CHEF = 1,
  WAITER = 2,
  POS_ADMIN = 3,
  CUSTOMER = 4
}

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  userRole: Role | null;
  login: (token: string, role?: Role) => void;
  logout: () => void;
  hasRole: (role: Role) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);

  // Check localStorage on initial load and validate token
  useEffect(() => {
    const storedToken = localStorage.getItem("auth-token");
    const storedRole = localStorage.getItem("auth-role");
    
    if (storedToken) {
      // Check if token is valid
      if (!isTokenExpired()) {
        setToken(storedToken);
        
        if (storedRole && !isNaN(Number(storedRole))) {
          setUserRole(Number(storedRole) as Role);
        }
      } else {
        // If token is expired, log the user out
        logout();
      }
    }
  }, []);

  // Add periodic token validation check
  useEffect(() => {
    // Check token validity every minute
    const intervalId = setInterval(() => {
      if (token && isTokenExpired()) {
        console.log("Token expired during session, logging out");
        logout();
      }
    }, 60000); // 60 seconds
    
    return () => clearInterval(intervalId);
  }, [token]);

  const login = (newToken: string, role?: Role) => {
    localStorage.setItem("auth-token", newToken);
    setToken(newToken);
    
    if (role !== undefined) {
      localStorage.setItem("auth-role", role.toString());
      setUserRole(role);
    } else {
      // Clear any existing role if none is provided
      localStorage.removeItem("auth-role");
      setUserRole(null);
    }
  };

  // Use the centralized logout function
  const handleLogout = () => {
    logout();
    // Update local state as well
    setToken(null);
    setUserRole(null);
  };
  
  // Helper function to check if user has a specific role
  const hasRole = (role: Role): boolean => {
    return userRole === role;
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        userRole,
        login,
        logout: handleLogout,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 