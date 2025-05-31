import {
  LayoutGrid,
  Utensils,
  ShoppingBag,
  Table,
  UtensilsCrossed,
  Users,
  DollarSign,
  Printer,
} from "lucide-react";
import { Role } from "../lib/AuthContext";

export const getAllMenuItems = () => {
  return [
    {
      icon: <LayoutGrid size={20} />,
      title: "Dashboard",
      path: "/admin/dashboard",
      roles: [Role.ADMIN, Role.WAITER],
    },
    {
      icon: <LayoutGrid size={20} />,
      title: "Manage Categories",
      path: "/admin/categories",
      roles: [Role.ADMIN],
    },
    {
      icon: <Utensils size={20} />,
      title: "Manage Menus",
      path: "/admin/menus",
      roles: [Role.ADMIN],
    },
    {
      icon: <ShoppingBag size={20} />,
      title: "Manage Items",
      path: "/admin/items",
      roles: [Role.ADMIN, Role.CHEF],
    },
    {
      icon: <Table size={20} />,
      title: "Manage Tables",
      path: "/admin/tables",
      roles: [Role.ADMIN, Role.WAITER],
    },
    {
      icon: <Users size={20} />,
      title: "Settings",
      path: "/admin/settings",
      roles: [Role.ADMIN],
    },
    {
      icon: <DollarSign size={20} />,
      title: "POS System",
      path: "/posAdmin/pos",
      roles: [Role.POS_ADMIN, Role.ADMIN],
    },
    {
      icon: <UtensilsCrossed size={20} />,
      title: "Chef Dashboard",
      path: "/chef",
      roles: [Role.CHEF],
    },
    {
      icon: <ShoppingBag size={20} />,
      title: "Orders",
      path: "/chef/orders",
      roles: [Role.CHEF, Role.ADMIN],
    },
    {
      icon: <ShoppingBag size={20} />,
      title: "Order Status",
      path: "/waiter/orders",
      roles: [Role.WAITER, Role.ADMIN],
    },
    {
      icon: <Printer size={20} />,
      title: "Order Status KOT",
      path: "/waiter/ordersKOT",
      roles: [Role.WAITER, Role.ADMIN],
    },

  ];
};
