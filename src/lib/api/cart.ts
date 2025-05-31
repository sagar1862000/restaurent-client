import { apiClient } from './client';
import { MenuItem } from './menuItems';

export interface CartItem {
  id: number;
  tableId: number;
  itemId: number;
  quantity: number;
  isHalfPortion: boolean;
  item: MenuItem;
  createdAt?: string;
  updatedAt?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export interface Order {
  id: number;
  tableId: number;
  status: string;
  total: number;
  orderItems: {
    id: number;
    orderId: number;
    itemId: number;
    quantity: number;
    price: number;
    isHalfPortion: boolean;
    item: {
      id: number;
      name: string;
      description?: string;
    };
  }[];
  createdAt: string;
  updatedAt: string;
}

export const cartApi = {
  // Get cart by table ID
  getCartByTableId: async (tableId: number): Promise<Cart> => {
    const { data } = await apiClient.get(`/tables/${tableId}/cart`);
    return data;
  },

  // Add item to cart
  addToCart: async (tableId: number, itemId: number, quantity: number, isHalfPortion: boolean = false): Promise<CartItem> => {
    const { data } = await apiClient.post(`/tables/${tableId}/cart`, { itemId, quantity, isHalfPortion });
    return data;
  },

  // Update cart item quantity
  updateCartItem: async (cartItemId: number, quantity: number, isHalfPortion?: boolean): Promise<CartItem> => {
    const payload: any = { quantity };
    if (isHalfPortion !== undefined) {
      payload.isHalfPortion = isHalfPortion;
    }
    const { data } = await apiClient.put(`/cart/${cartItemId}`, payload);
    return data;
  },

  // Remove item from cart
  removeFromCart: async (cartItemId: number): Promise<{success: boolean; message: string}> => {
    const { data } = await apiClient.delete(`/cart/${cartItemId}`);
    return data;
  },

  // Clear cart
  clearCart: async (tableId: number): Promise<{success: boolean; message: string}> => {
    const { data } = await apiClient.delete(`/tables/${tableId}/cart`);
    return data;
  },

  // Place order
  placeOrder: async (tableId: number): Promise<Order> => {
    const { data } = await apiClient.post(`/tables/${tableId}/place-order`);
    return data;
  }
}; 