import { apiClient } from './client';

// Role type definition
export type UserRole = 'admin' | 'chef' | 'waiter' | 'customer' | 'pos-admin';

// Auth endpoints
export const authApi = {
  login: async (email: string, password: string) => {
    try {
      const response = await apiClient.post("/users/login", { email, password });
      console.log("login response", response.data);
      return response.data;
    } catch (error: any) {
      console.log("login error response", error.response?.data);
      // If user has no role assigned, we want to handle this case
      if (error.response?.status === 401 && error.response?.data?.message === 'User has not been assigned a role') {
        throw new Error('User has not been assigned a role');
      }
      throw error;
    }
  },
  
  signup: async (name: string, email: string, password: string) => {
    const response = await apiClient.post("/users/signup", { name, email, password });
    return response.data;
  },
  
  getMe: async () => {
    const response = await apiClient.get("/users/me");
    return response.data;
  },
  
  updateUserRole: async (userId: number, role: UserRole) => {
    const response = await apiClient.put("/users/role", { userId, role });
    return response.data;
  },
  
  getAllUsers: async () => {
    const response = await apiClient.get("/users");
    return response.data;
  }
};

export default apiClient; 