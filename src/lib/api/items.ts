import { apiClient as api } from './client';

export interface Item {
  id: number;
  name: string;
  description?: string;
  price: number;
  preparationTime: number;
  imageUrl?: string;
  isAvailable: boolean;
  categoryId: number;
  category?: {
    id: number;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateItemPayload {
  name: string;
  description: string;
  price: number;
  preparationTime: number;
  isAvailable: boolean;
  categoryId: number;
  image?: File;
}

export interface UpdateItemPayload {
  name?: string;
  description?: string;
  price?: number;
  preparationTime?: number;
  isAvailable?: boolean;
  categoryId?: number;
  image?: File;
}

export interface ImportItemsResult {
  message: string;
  results: {
    success: number;
    failed: number;
    errors: { row: number; message: string }[];
  };
}

export const itemsApi = {
  // Get all items
  getAll: async (): Promise<Item[]> => {
    try {
      const response = await api.get('/items');
      return response.data;
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  },

  // Get item by ID
  getById: async (id: number): Promise<Item> => {
    try {
      const response = await api.get(`/items/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching item with id ${id}:`, error);
      throw error;
    }
  },

  // Create a new item
  create: async (item: CreateItemPayload): Promise<Item> => {
    try {
      // If there's an image, we need to use FormData
      if (item.image) {
        const formData = new FormData();
        formData.append('name', item.name);
        formData.append('description', item.description || '');
        formData.append('price', item.price.toString());
        formData.append('preparationTime', item.preparationTime.toString());
        formData.append('isAvailable', item.isAvailable.toString());
        formData.append('categoryId', item.categoryId.toString());
        formData.append('image', item.image);

        const response = await api.post('/items', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } else {
        const response = await api.post('/items', item);
        return response.data;
      }
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  },

  // Update an item
  update: async (id: number, item: UpdateItemPayload): Promise<Item> => {
    try {
      // If there's an image, we need to use FormData
      if (item.image) {
        const formData = new FormData();
        
        if (item.name !== undefined) formData.append('name', item.name);
        if (item.description !== undefined) formData.append('description', item.description);
        if (item.price !== undefined) formData.append('price', item.price.toString());
        if (item.preparationTime !== undefined) formData.append('preparationTime', item.preparationTime.toString());
        if (item.isAvailable !== undefined) formData.append('isAvailable', item.isAvailable.toString());
        if (item.categoryId !== undefined) formData.append('categoryId', item.categoryId.toString());
        formData.append('image', item.image);

        const response = await api.put(`/items/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } else {
        const response = await api.put(`/items/${id}`, item);
        return response.data;
      }
    } catch (error) {
      console.error(`Error updating item with id ${id}:`, error);
      throw error;
    }
  },

  // Update item availability
  updateAvailability: async (id: number, isAvailable: boolean): Promise<Item> => {
    try {
      const response = await api.patch(`/items/${id}/availability`, { isAvailable });
      return response.data;
    } catch (error) {
      console.error(`Error updating availability for item with id ${id}:`, error);
      throw error;
    }
  },

  // Delete an item
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/items/${id}`);
    } catch (error) {
      console.error(`Error deleting item with id ${id}:`, error);
      throw error;
    }
  },

  // Import items from Excel
  importFromExcel: async (file: File): Promise<ImportItemsResult> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/items/import-excel", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error importing items from Excel:", error);
      throw error;
    }
  },

  // Download Excel template
  downloadExcelTemplate: () => {
    try {
      window.open(`${api.defaults.baseURL}/items/excel-template/download`, '_blank');
    } catch (error) {
      console.error("Error downloading Excel template:", error);
      throw error;
    }
  },

  // Get items by menu ID
  getByMenuId: async (menuId: string): Promise<Item[]> => {
    try {
      const response = await api.get(`/menus/${menuId}/items`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching items for menu ${menuId}:`, error);
      throw error;
    }
  }
}; 