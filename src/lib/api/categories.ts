import api from "./user";

export interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  image?: File;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  image?: File;
}

export interface ImportCategoriesResult {
  message: string;
  results: {
    success: number;
    failed: number;
    duplicates: number;
    errors: string[];
  };
}

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

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    try {
      const response = await api.get("/categories");
      return response.data;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  },

  getById: async (id: number): Promise<Category> => {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching category with id ${id}:`, error);
      throw error;
    }
  },

  create: async (category: CreateCategoryPayload): Promise<Category> => {
    try {
      // If there's an image, compress and convert it to base64
      if (category.image) {
        const base64Image = await compressAndConvertToBase64(category.image, 0.5); // Limit to 0.5MB
        const payload = {
          name: category.name,
          description: category.description
        };
        
        const response = await api.post("/categories", {
          ...payload,
          image: base64Image,
        });
        return response.data;
      } else {
        const response = await api.post("/categories", category);
        return response.data;
      }
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  },

  update: async (id: number, category: UpdateCategoryPayload): Promise<Category> => {
    try {
      // If there's an image, compress and convert it to base64
      if (category.image) {
        const base64Image = await compressAndConvertToBase64(category.image, 0.5); // Limit to 0.5MB
        const payload = {
          name: category.name,
          description: category.description
        };
        
        const response = await api.put(`/categories/${id}`, {
          ...payload,
          image: base64Image,
        });
        return response.data;
      } else {
        const response = await api.put(`/categories/${id}`, category);
        return response.data;
      }
    } catch (error) {
      console.error(`Error updating category with id ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/categories/${id}`);
    } catch (error) {
      console.error(`Error deleting category with id ${id}:`, error);
      throw error;
    }
  },

  importFromExcel: async (file: File): Promise<ImportCategoriesResult> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/categories/import-excel", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error importing categories from Excel:", error);
      throw error;
    }
  },

  downloadExcelTemplate: () => {
    try {
      // Using window.open for direct download
      window.open(`${api.defaults.baseURL}/categories/excel-template/download`, '_blank');
    } catch (error) {
      console.error("Error downloading Excel template:", error);
      throw error;
    }
  },
}; 