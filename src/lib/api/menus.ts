import api from "./user";

export interface Menu {
  id: string;
  name: string;
  totalItems: number;
  totalTables: number;
  description?: string;
  isAcceptingOrders: boolean;
  createdAt: string;
  updatedAt: string;
  tables?: Table[];
  items?: Item[];
}

// Reference interfaces from other parts of the application
interface Table {
  id: number;
  tableNumber: number;
  qrCodeUrl: string;
  location?: string;
}

interface Item {
  id: number;
  name: string;
  description?: string;
  price: number;
  preparationTime: number;
  imageUrl?: string;
  isAvailable: boolean;
  categoryId: number;
}

export const menusApi = {
  // Get all menus
  getAll: async (): Promise<Menu[]> => {
    const response = await api.get('/menus');
    return response.data;
  },

  // Get menu by ID
  getById: async (id: string): Promise<Menu> => {
    const response = await api.get(`/menus/${id}`);
    return response.data;
  },

  // Create a new menu
  create: async (data: { 
    name: string; 
    description?: string;
    isAcceptingOrders?: boolean;
  }): Promise<Menu> => {
    const response = await api.post('/menus', data);
    return response.data;
  },

  // Update a menu
  update: async (id: string, data: { 
    name: string; 
    description?: string;
    isAcceptingOrders?: boolean;
  }): Promise<Menu> => {
    const response = await api.put(`/menus/${id}`, data);
    return response.data;
  },

  // Delete a menu
  delete: async (id: string): Promise<void> => {
    await api.delete(`/menus/${id}`);
  },

  // Add item to menu
  addItem: async (menuId: string, itemId: number): Promise<Menu> => {
    const response = await api.post(`/menus/${menuId}/items`, { itemId });
    return response.data;
  },

  // Remove item from menu
  removeItem: async (menuId: string, itemId: number): Promise<Menu> => {
    const response = await api.delete(`/menus/${menuId}/items/${itemId}`);
    return response.data;
  },

  // Toggle order acceptance
  toggleOrderAcceptance: async (id: string, isAcceptingOrders: boolean): Promise<Menu> => {
    const response = await api.post(`/menus/${id}/toggle-orders`, { isAcceptingOrders });
    return response.data;
  }
}; 