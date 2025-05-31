// Re-export APIs from individual modules
export { authApi } from './api/user';
export { menuItemsApi } from './api/menuItems';
export { cartApi } from './api/cart';
export { default as api } from './api/user';

// Helper functions
import { Role } from './AuthContext';

// Convert role number to readable name
export const getRoleName = (role: Role): string => {
  switch (role) {
    case Role.ADMIN:
      return "Admin";
    case Role.CHEF:
      return "Chef";
    case Role.WAITER:
      return "Waiter";
    case Role.POS_ADMIN:
      return "POS Admin";
    case Role.CUSTOMER:
      return "Customer";
    default:
      return "Unknown";
  }
}; 