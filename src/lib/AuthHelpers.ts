/**
 * Centralized authentication helper functions
 * This file contains helper functions for authentication-related operations
 * to ensure consistent behavior across the application
 */

/**
 * Handles user logout by:
 * 1. Removing auth tokens from localStorage
 * 2. Redirecting to the login page
 */
export const logout = () => {
  if (typeof window !== 'undefined') {
    // Clear all auth-related items from localStorage
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-role');
    
    // Redirect to login page
    window.location.href = '/login';
  }
};

/**
 * Checks if the current token is expired
 * @returns boolean indicating if token is expired
 */
export const isTokenExpired = (): boolean => {
  try {
    const token = localStorage.getItem('auth-token');
    if (!token) return true;
    
    // JWT tokens are in format: header.payload.signature
    // We need to decode the payload (middle part)
    const payload = token.split('.')[1];
    if (!payload) return true;
    
    // Base64 decode and parse as JSON
    const decoded = JSON.parse(atob(payload));
    
    // Check if the expiration time is past
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // If there's any error, consider token expired
  }
};

/**
 * Validates the current authentication state
 * @returns boolean indicating if user is authenticated with a valid token
 */
export const validateAuth = (): boolean => {
  const token = localStorage.getItem('auth-token');
  if (!token) return false;
  
  return !isTokenExpired();
}; 