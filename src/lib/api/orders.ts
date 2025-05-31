import { apiClient } from './client';

// Interface definitions based on server types
export interface OrderItem {
  id: number;
  orderId: number;
  itemId: number;
  quantity: number;
  price: number;
  item?: {
    id: number;
    name: string;
    description?: string;
    imageUrl?: string;
  };
}

// Renamed to avoid collision with the Order interface in cart.ts
export interface WaiterOrder {
  id: number;
  tableId: number;
  table?: {
    id: number;
    tableNumber: number;
    name?: string;
  };
  status: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  total: number;
  orderItems: OrderItem[];
  createdAt: string;
  updatedAt: string;
  paymentDetails?: PaymentDetails;
}

// Dashboard data for waiters
export interface WaiterDashboardOrders {
  activeOrders: WaiterOrder[];
  completedOrders: WaiterOrder[];
}

// Payment details for completing orders
export interface PaymentDetails {
  paymentMethod: 'cash' | 'card';
  amountPaid: number;
  notes?: string;
  taxPercentage?: number;
  taxAmount?: number;
  subtotal?: number;
}

export const ordersApi = {
  // Get all orders
  getAll: async (): Promise<WaiterOrder[]> => {
    try {
      const response = await apiClient.get('/orders');
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  // Get order by ID
  getById: async (orderId: number): Promise<WaiterOrder> => {
    try {
      const response = await apiClient.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      throw error;
    }
  },

  // Get orders by status
  getByStatus: async (status: WaiterOrder['status']): Promise<WaiterOrder[]> => {
    try {
      const response = await apiClient.get(`/orders/status/${status}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching orders with status ${status}:`, error);
      throw error;
    }
  },

  // Update order status
  updateStatus: async (orderId: number, status: WaiterOrder['status']): Promise<WaiterOrder> => {
    try {
      const response = await apiClient.patch(`/orders/${orderId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating order ${orderId} status:`, error);
      throw error;
    }
  },

  // Get waiter dashboard orders data
  getWaiterDashboardOrders: async (): Promise<WaiterDashboardOrders> => {
    try {
      const response = await apiClient.get('/waiter/dashboard/orders');
      return response.data;
    } catch (error) {
      console.error('Error fetching waiter dashboard orders:', error);
      throw error;
    }
  },

  // Get delivered orders for POS
  getDeliveredOrders: async (): Promise<WaiterOrder[]> => {
    try {
      const response = await apiClient.get('/orders/pos/delivered');
      return response.data;
    } catch (error) {
      console.error('Error fetching delivered orders for POS:', error);
      return [];
    }
  },

  // Complete order after payment
  completeOrder: async (orderId: number, paymentDetails: PaymentDetails): Promise<{order: WaiterOrder, message: string}> => {
    try {
      const response = await apiClient.post('/orders/pos/complete', {
        orderId,
        ...paymentDetails
      });
      return response.data;
    } catch (error) {
      console.error('Error completing order:', error);
      throw error;
    }
  }
}; 