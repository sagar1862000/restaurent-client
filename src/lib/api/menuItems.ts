import api from "./user";

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  fullPrice: number;
  halfPrice?: number;
  preparationTime: number;
  imageUrl?: string;
  isAvailable: boolean;
  subcategory?: string;
  tags?: string[];
  categoryId: number;
  category?: {
    id: number;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMenuItemPayload {
  name: string;
  description: string;
  fullPrice: number;
  halfPrice?: number;
  preparationTime: number;
  isAvailable: boolean;
  subcategory?: string;
  tags?: string[];
  categoryId: number;
  image?: File;
}

export interface UpdateMenuItemPayload {
  name?: string;
  description?: string;
  fullPrice?: number;
  halfPrice?: number;
  preparationTime?: number;
  isAvailable?: boolean;
  subcategory?: string;
  tags?: string[];
  categoryId?: number;
  image?: File;
}

// Helper function to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Helper function to compress and convert image to base64
const compressAndConvertToBase64 = (file: File, maxSizeMB: number = 1): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Create a canvas to resize the image
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Create file reader to read the file
    const reader = new FileReader();
    
    // When file is loaded as data URL
    reader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error('Failed to read file'));
        return;
      }
      
      // Create image from data URL
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        // Target size in bytes (convert MB to bytes)
        const targetSizeBytes = maxSizeMB * 1024 * 1024;
        
        // Start with original dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw image on canvas
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }
        
        // Get base64 with quality reduction
        let quality = 0.9; // Start with high quality
        let base64 = canvas.toDataURL('image/jpeg', quality);
        
        // Reduce quality until we get under target size or reach minimum quality
        while (base64.length > targetSizeBytes && quality > 0.1) {
          quality -= 0.1;
          base64 = canvas.toDataURL('image/jpeg', quality);
        }
        
        resolve(base64);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      // Set image source to file data URL
      img.src = e.target.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    // Read file as data URL
    reader.readAsDataURL(file);
  });
};

export const menuItemsApi = {
  getAll: async (): Promise<MenuItem[]> => {
    try {
      const response = await api.get("/items");
      return response.data;
    } catch (error) {
      console.error("Error fetching menu items:", error);
      throw error;
    }
  },

  getById: async (id: number): Promise<MenuItem> => {
    try {
      const response = await api.get(`/items/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching menu item with id ${id}:`, error);
      throw error;
    }
  },

  getByCategory: async (categoryId: number): Promise<MenuItem[]> => {
    try {
      const response = await api.get(`/items/category/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching menu items for category ${categoryId}:`, error);
      throw error;
    }
  },

  create: async (item: CreateMenuItemPayload): Promise<MenuItem> => {
    try {
      // If there's an image, compress and convert it to base64
      if (item.image) {
        console.log('Compressing and converting image to base64');
        const base64Image = await compressAndConvertToBase64(item.image, 0.5); // Limit to 0.5MB
        console.log('Image compressed successfully, length:', base64Image.length);
        
        const payload = {
          name: item.name,
          description: item.description || "",
          fullPrice: item.fullPrice,
          halfPrice: item.halfPrice,
          preparationTime: item.preparationTime,
          isAvailable: item.isAvailable,
          categoryId: item.categoryId,
          subcategory: item.subcategory,
          tags: item.tags,
          image: base64Image
        };
        
        console.log('Sending payload with image to server');
        const response = await api.post("/items", payload);
        return response.data;
      } else {
        const response = await api.post("/items", item);
        return response.data;
      }
    } catch (error) {
      console.error("Error creating menu item:", error);
      throw error;
    }
  },

  update: async (id: number, item: UpdateMenuItemPayload): Promise<MenuItem> => {
    try {
      // If there's an image, compress and convert it to base64
      if (item.image) {
        console.log('Compressing and converting image to base64 for update');
        const base64Image = await compressAndConvertToBase64(item.image, 0.5); // Limit to 0.5MB
        console.log('Image compressed successfully for update, length:', base64Image.length);
        
        const payload = {
          ...item,
          image: base64Image
        };
        
        console.log('Sending update payload with image to server');
        const response = await api.put(`/items/${id}`, payload);
        return response.data;
      } else {
        const response = await api.put(`/items/${id}`, item);
        return response.data;
      }
    } catch (error) {
      console.error(`Error updating menu item with id ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/items/${id}`);
    } catch (error) {
      console.error(`Error deleting menu item with id ${id}:`, error);
      throw error;
    }
  },
}; 