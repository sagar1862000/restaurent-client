import api from "./user";

export interface Table {
  id: number;
  tableNumber: number;
  qrCodeUrl: string;
  location?: string;
  menuId: number;
  createdAt: string;
  updatedAt: string;
  menuName?: string;
  menu?: {
    id: number;
    name: string;
  };
}

const API_URL = '/tables';

export const tablesApi = {
  /**
   * Get all tables
   */
  async getAll(): Promise<Table[]> {
    const response = await api.get(API_URL);
    return response.data;
  },

  /**
   * Get a table by ID
   */
  async getById(id: string): Promise<Table> {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  },

  /**
   * Get tables by menu ID
   */
  async getByMenuId(menuId: string): Promise<Table[]> {
    const response = await api.get(`${API_URL}/menu/${menuId}`);
    return response.data;
  },

  /**
   * Create a new table
   */
  async create(data: {
    tableNumber: number;
    location?: string;
    menuId: number;
  }): Promise<Table> {
    const response = await api.post(API_URL, data);
    return response.data;
  },

  /**
   * Update a table
   */
  async update(
    id: number,
    data: {
      tableNumber?: number;
      location?: string;
      menuId?: number;
    }
  ): Promise<Table> {
    const response = await api.put(`${API_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Delete a table
   */
  async delete(id: number): Promise<{ message: string }> {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  },
}; 