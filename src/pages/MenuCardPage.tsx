import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Search,
  AlignJustify,
  ShoppingCart,
  Info,
  Clock,
  CheckCircle,
  Utensils,
  Truck,
  Check,
  Facebook,
  Instagram,
  AlertCircle,
  Coffee,
  Plus,
  Minus,
} from "lucide-react";
import { tablesApi } from "../lib/api/tables";
import { menusApi } from "../lib/api/menus";
import { categoriesApi } from "../lib/api/categories";
import { MenuItem } from "../lib/api/menuItems";
import { Category } from "../lib/api/categories";
import { cartApi, CartItem } from "../lib/api/cart";
import { ordersApi, WaiterOrder } from "../lib/api/orders";
import CartComponent from "../components/cart/CartComponent";
import { useSocket } from "../lib/SocketContext";
import { formatPrice, hasHalfPortionPrice } from "../lib/utils";

// Animated container variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Item variants for staggered animation
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

// Interface for displaying orders
interface CustomerOrder extends WaiterOrder {
  statusText: string;
  statusColor: string;
  icon: React.ReactNode;
}

export default function MenuCardPage() {
  const { tableNumber } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState<any>(null);
  const [menu, setMenu] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [showOrderStatus, setShowOrderStatus] = useState(false);
  const [showFullFooter, setShowFullFooter] = useState(false);

  // UI states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cartCount, setCartCount] = useState(0);
  const [activeTab, setActiveTab] = useState("menu"); // 'menu' or 'info' or 'orders'
  const [isCartOpen, setIsCartOpen] = useState(false);

  // New state for tracking active subcategory
  const [activeSubcategories, setActiveSubcategories] = useState<
    Record<string, string>
  >({});

  // Add a notice banner state
  const [showNoticeBanner, setShowNoticeBanner] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState("");

  // Update state to track both full and half portion quantities
  const [itemQuantities, setItemQuantities] = useState<Record<number, number>>(
    {}
  );
  const [halfPortionQuantities, setHalfPortionQuantities] = useState<
    Record<number, number>
  >({});
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!tableNumber) {
        setError("No table information found. Please scan a valid QR code.");
        setLoading(false);
        return;
      }

      try {
        // Find table by table number
        const tablesData = await tablesApi.getAll();
        const foundTable = tablesData.find(
          (t) => t.tableNumber.toString() === tableNumber
        );

        if (!foundTable) {
          setError(
            "Table not found. Please check the QR code or ask for assistance."
          );
          setLoading(false);
          return;
        }

        setTable(foundTable);

        // Get menu for this table
        try {
          const menuData = await menusApi.getById(foundTable.menuId.toString());
          setMenu(menuData);

          // Get items for this menu
          if (menuData.items) {
            setItems(
              menuData.items.map((item) => {
                // Some items may have halfPrice already set in the database
                // Use database halfPrice if available, otherwise check if there's price data to convert
                return {
                  ...item,
                  fullPrice: (item as any).fullPrice || item.price || 0, // Use existing fullPrice or convert from price
                  halfPrice:
                    (item as any).halfPrice ||
                    (item.price ? item.price * 0.6 : undefined), // Keep existing halfPrice or calculate from price
                };
              })
            );
          }
        } catch (menuErr) {
          console.error("Error fetching menu data:", menuErr);
          setError(
            "No menu is currently available for this table. Please ask staff for assistance."
          );
          setLoading(false);
          return;
        }

        // Get categories
        try {
          const categoriesData = await categoriesApi.getAll();
          setCategories(categoriesData);
        } catch (categoriesErr) {
          console.error("Error fetching categories:", categoriesErr);
          // We can still proceed with missing categories
        }

        // Fetch active orders for this table
        fetchTableOrders(foundTable.id);

        setLoading(false);
      } catch (err) {
        console.error("Error in menu data loading process:", err);
        setError(
          "Unable to load menu information. Please try again or ask for assistance."
        );
        setLoading(false);
      }
    }

    fetchData();
  }, [tableNumber]);

  useEffect(() => {
    // Detect scroll to bottom to show full footer
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // If we're near the bottom (within 200px), show the full footer
      if (scrollPosition + windowHeight >= documentHeight - 200) {
        setShowFullFooter(true);
      } else {
        setShowFullFooter(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Set up socket listeners for real-time order updates
  useEffect(() => {
    if (!table) return;

    // Listen for order status changes
    socket.on("order:status-change", (updatedOrder) => {
      console.log("Received order:status-change", updatedOrder);

      if (updatedOrder.tableId === table.id) {
        setOrders((prevOrders) => {
          const orderExists = prevOrders.some(
            (order) => order.id === updatedOrder.id
          );

          if (!orderExists) {
            // It's a new order
            return [...prevOrders, formatOrderForDisplay(updatedOrder)];
          } else {
            // Update existing order
            return prevOrders.map((order) =>
              order.id === updatedOrder.id
                ? formatOrderForDisplay(updatedOrder)
                : order
            );
          }
        });

        // Show toast notification for status change
        if (updatedOrder.status === "READY") {
          setShowOrderStatus(true);
        }
      }
    });

    // Listen for preparing status
    socket.on("order:status-preparing", (updatedOrder) => {
      console.log("Received order:status-preparing", updatedOrder);

      if (updatedOrder.tableId === table.id) {
        setOrders((prevOrders) => {
          const orderExists = prevOrders.some(
            (order) => order.id === updatedOrder.id
          );

          if (!orderExists) {
            return [...prevOrders, formatOrderForDisplay(updatedOrder)];
          } else {
            return prevOrders.map((order) =>
              order.id === updatedOrder.id
                ? formatOrderForDisplay(updatedOrder)
                : order
            );
          }
        });
      }
    });

    return () => {
      socket.off("order:status-change");
      socket.off("order:status-preparing");
    };
  }, [socket, table]);

  // Add a function to check if an order is less than 3 hours old
  const isOrderRecent = (timestamp: string): boolean => {
    const orderTime = new Date(timestamp);
    const now = new Date();
    const threeHoursInMs = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
    return now.getTime() - orderTime.getTime() < threeHoursInMs;
  };

  // Fetch active orders for the current table
  const fetchTableOrders = async (tableId: number) => {
    try {
      const allOrders = await ordersApi.getAll();
      const tableOrders = allOrders
        .filter(
          (order) =>
            order.tableId === tableId &&
            !["COMPLETED", "CANCELLED"].includes(order.status) &&
            isOrderRecent(order.createdAt)
        )
        .map(formatOrderForDisplay);

      setOrders(tableOrders);

      // If there are active orders, show the order status tab
      if (tableOrders.length > 0) {
        setShowOrderStatus(true);
      }
    } catch (error) {
      console.error("Error fetching table orders:", error);
    }
  };

  // Format order for display with status text, color and icon
  const formatOrderForDisplay = (order: WaiterOrder): CustomerOrder => {
    let statusText = "";
    let statusColor = "";
    let icon;

    switch (order.status) {
      case "PENDING":
        statusText = "Order Received";
        statusColor = "text-blue-500 bg-blue-500/10";
        icon = <Clock className="h-5 w-5 text-blue-500" />;
        break;
      case "PREPARING":
        statusText = "Preparing Your Order";
        statusColor = "text-amber-500 bg-amber-500/10";
        icon = <Utensils className="h-5 w-5 text-amber-500" />;
        break;
      case "READY":
        statusText = "Ready for Pickup";
        statusColor = "text-green-500 bg-green-500/10";
        icon = <CheckCircle className="h-5 w-5 text-green-500" />;
        break;
      case "DELIVERED":
        statusText = "Order Delivered";
        statusColor = "text-purple-500 bg-purple-500/10";
        icon = <Truck className="h-5 w-5 text-purple-500" />;
        break;
      case "COMPLETED":
        statusText = "Order Completed";
        statusColor = "text-gray-500 bg-gray-500/10";
        icon = <Check className="h-5 w-5 text-gray-500" />;
        break;
      default:
        statusText = order.status;
        statusColor = "text-gray-500 bg-gray-500/10";
        icon = <Info className="h-5 w-5 text-gray-500" />;
    }

    return {
      ...order,
      statusText,
      statusColor,
      icon,
    };
  };

  // Filter items based on search and category
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false);

    const matchesCategory =
      selectedCategory === "all" ||
      item.categoryId.toString() === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Group items by category and then by subcategory
  const getGroupedItems = (items: MenuItem[]) => {
    // First group by category
    const byCategory = items.reduce((acc, item) => {
      const category = categories.find((c) => c.id === item.categoryId);
      const categoryName = category ? category.name : "Other";

      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }

      acc[categoryName].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);

    // For each category, extract unique subcategories
    const categorySubcategories: Record<string, string[]> = {};

    Object.entries(byCategory).forEach(([category, categoryItems]) => {
      // Get all subcategories for this category
      const subcategories = categoryItems
        .map((item) => item.subcategory)
        .filter(
          (subcategory): subcategory is string =>
            subcategory !== undefined &&
            subcategory !== null &&
            subcategory !== ""
        );

      // Add unique subcategories
      categorySubcategories[category] = [
        "All",
        ...Array.from(new Set(subcategories)),
      ];

      // Initialize active subcategory if not set
      if (!activeSubcategories[category]) {
        setActiveSubcategories((prev) => ({
          ...prev,
          [category]: "All",
        }));
      }
    });

    return { byCategory, categorySubcategories };
  };

  // Use the grouping function to organize data
  const { byCategory, categorySubcategories } = getGroupedItems(filteredItems);

  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };

  // Format time elapsed since order was created
  const formatTimeElapsed = (timestamp: string) => {
    const orderTime = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - orderTime.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes === 1) return "1 minute ago";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const hours = Math.floor(diffInMinutes / 60);
    if (hours === 1) return "1 hour ago";
    return `${hours} hours ago`;
  };

  // Add an effect to fetch cart data when table is loaded
  useEffect(() => {
    if (table) {
      fetchCartData(table.id);
    }
  }, [table]);

  // Function to fetch cart data
  const fetchCartData = async (tableId: number) => {
    try {
      const cartData = await cartApi.getCartByTableId(tableId);
      setCartItems(cartData.items);
      setCartCount(
        cartData.items.reduce(
          (sum: number, item: CartItem) => sum + item.quantity,
          0
        )
      );

      // Initialize quantities based on cart data
      const fullItems: Record<number, number> = {};
      const halfItems: Record<number, number> = {};

      cartData.items.forEach((item) => {
        if (item.isHalfPortion) {
          halfItems[item.itemId] = item.quantity;
        } else {
          fullItems[item.itemId] = item.quantity;
        }
      });

      setItemQuantities(fullItems);
      setHalfPortionQuantities(halfItems);
    } catch (err) {
      console.error("Error fetching cart data:", err);
    }
  };

  // Add functions to handle quantity changes for full portions
  const incrementQuantity = async (itemId: number) => {
    if (!table) return;

    const newQuantity = (itemQuantities[itemId] || 0) + 1;
    setItemQuantities((prev) => ({
      ...prev,
      [itemId]: newQuantity,
    }));

    try {
      // Find if this item already exists in cart
      const existingItem = cartItems.find(
        (item) => item.itemId === itemId && !item.isHalfPortion
      );

      if (existingItem) {
        // Update existing cart item
        await cartApi.updateCartItem(existingItem.id, newQuantity);
      } else {
        // Add new item to cart
        const newItem = await cartApi.addToCart(table.id, itemId, 1, false);
        setCartItems((prev) => [...prev, newItem]);
      }

      // Refresh cart data to get updated totals
      await fetchCartData(table.id);
    } catch (err) {
      console.error("Error updating cart:", err);
    }
  };

  const decrementQuantity = async (itemId: number) => {
    if (!table) return;

    const currentQuantity = itemQuantities[itemId] || 0;
    if (currentQuantity <= 0) return;

    const newQuantity = currentQuantity - 1;
    setItemQuantities((prev) => ({
      ...prev,
      [itemId]: newQuantity,
    }));

    try {
      // Find the existing cart item
      const existingItem = cartItems.find(
        (item) => item.itemId === itemId && !item.isHalfPortion
      );

      if (existingItem) {
        if (newQuantity === 0) {
          // Remove item from cart
          await cartApi.removeFromCart(existingItem.id);
          setCartItems((prev) =>
            prev.filter((item) => item.id !== existingItem.id)
          );
        } else {
          // Update quantity
          await cartApi.updateCartItem(existingItem.id, newQuantity);
        }

        // Refresh cart data
        await fetchCartData(table.id);
      }
    } catch (err) {
      console.error("Error updating cart:", err);
    }
  };

  // Add functions to handle quantity changes for half portions
  const incrementHalfQuantity = async (itemId: number) => {
    if (!table) return;

    const newQuantity = (halfPortionQuantities[itemId] || 0) + 1;
    setHalfPortionQuantities((prev) => ({
      ...prev,
      [itemId]: newQuantity,
    }));

    try {
      // Find if this item already exists in cart
      const existingItem = cartItems.find(
        (item) => item.itemId === itemId && item.isHalfPortion
      );

      if (existingItem) {
        // Update existing cart item
        await cartApi.updateCartItem(existingItem.id, newQuantity);
      } else {
        // Add new item to cart
        const newItem = await cartApi.addToCart(table.id, itemId, 1, true);
        setCartItems((prev) => [...prev, newItem]);
      }

      // Refresh cart data to get updated totals
      await fetchCartData(table.id);
    } catch (err) {
      console.error("Error updating cart:", err);
    }
  };

  const decrementHalfQuantity = async (itemId: number) => {
    if (!table) return;

    const currentQuantity = halfPortionQuantities[itemId] || 0;
    if (currentQuantity <= 0) return;

    const newQuantity = currentQuantity - 1;
    setHalfPortionQuantities((prev) => ({
      ...prev,
      [itemId]: newQuantity,
    }));

    try {
      // Find the existing cart item
      const existingItem = cartItems.find(
        (item) => item.itemId === itemId && item.isHalfPortion
      );

      if (existingItem) {
        if (newQuantity === 0) {
          // Remove item from cart
          await cartApi.removeFromCart(existingItem.id);
          setCartItems((prev) =>
            prev.filter((item) => item.id !== existingItem.id)
          );
        } else {
          // Update quantity
          await cartApi.updateCartItem(existingItem.id, newQuantity);
        }

        // Refresh cart data
        await fetchCartData(table.id);
      }
    } catch (err) {
      console.error("Error updating cart:", err);
    }
  };

  // Handle cart update from CartComponent
  const handleCartUpdate = (itemCount: number) => {
    setCartCount(itemCount);
    if (table) {
      fetchCartData(table.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#051119] text-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-[#00EAF0] rounded-full animate-spin mb-4"></div>
          <p className="text-lg">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#051119] text-white flex items-center justify-center p-4">
        <div className="bg-[#0A2331] rounded-lg p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <AlertCircle className="h-16 w-16 text-amber-500" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">Menu Unavailable</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleBack}
              className="w-full px-4 py-3 bg-amber-500 text-black rounded-lg font-medium hover:bg-amber-400 transition-colors"
            >
              Go Back
            </button>
            <div className="flex items-center gap-2 text-gray-400 text-sm mt-2">
              <Coffee className="h-4 w-4" />
              <span>Or ask our staff for assistance</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#051119] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A2331] border-b border-[#00EAF0]/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="flex-shrink-0"
                style={{ width: "auto", height: "42px" }}
              >
                <img
                  src="/logo.png"
                  alt="Skybar Cafe and Lounge"
                  className="h-full w-auto object-contain"
                  style={{ maxWidth: "none" }}
                />
              </div>
            </div>
            {/* Only show cart icon if menu is accepting orders */}
            {menu?.isAcceptingOrders && (
              <button
                className="p-2 rounded-full hover:bg-[#13465D] relative"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart className="h-6 w-6 text-[#00EAF0]" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#00EAF0] text-[#051119] text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
            {/* Add a spacer element when cart is hidden to maintain header layout */}
            {!menu?.isAcceptingOrders && <div className="w-10"></div>}
          </div>
        </div>
      </header>

      {/* Notice Banner */}
      {showNoticeBanner && (
        <div className="bg-[#00EAF0]/20 px-4 py-3">
          <div className="container mx-auto flex items-center">
            <Info className="h-5 w-5 mr-2 text-[#00EAF0]" />
            <p className="text-sm text-[#00EAF0]">{noticeMessage}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-[#0A2331] border-b border-[#13465D]">
        <div className="container mx-auto px-4">
          <div className="flex">
            <button
              className={`px-4 py-3 font-medium text-sm transition-colors relative ${
                activeTab === "menu"
                  ? "text-[#00EAF0]"
                  : "text-gray-400 hover:text-[#00EAF0]"
              }`}
              onClick={() => setActiveTab("menu")}
            >
              <span className="flex items-center gap-2">
                <AlignJustify className="h-4 w-4" />
                Menu
              </span>
              {activeTab === "menu" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00EAF0]"
                />
              )}
            </button>

            {showOrderStatus && (
              <button
                className={`px-4 py-3 font-medium text-sm transition-colors relative ${
                  activeTab === "orders"
                    ? "text-[#00EAF0]"
                    : "text-gray-400 hover:text-[#00EAF0]"
                }`}
                onClick={() => setActiveTab("orders")}
              >
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Orders
                  {orders.some((order) => order.status === "READY") && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00EAF0] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00EAF0]"></span>
                    </span>
                  )}
                </span>
                {activeTab === "orders" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00EAF0]"
                  />
                )}
              </button>
            )}

            <button
              className={`px-4 py-3 font-medium text-sm transition-colors relative ${
                activeTab === "info"
                  ? "text-[#00EAF0]"
                  : "text-gray-400 hover:text-[#00EAF0]"
              }`}
              onClick={() => setActiveTab("info")}
            >
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Info
              </span>
              {activeTab === "info" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00EAF0]"
                />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {activeTab === "menu" ? (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="container mx-auto px-4 py-6 mb-24"
          >
            {/* Search and filters */}
            <div className="relative mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#00EAF0] h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search menu..."
                  className="w-full bg-[#0A2331] border border-[#13465D] rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00EAF0]/30"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category Pills */}
              <div className="flex gap-2 overflow-x-auto py-4 hide-scrollbar">
                <button
                  className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                    selectedCategory === "all"
                      ? "bg-[#00EAF0] text-[#051119] font-medium"
                      : "bg-[#0A2331] text-white hover:bg-[#13465D]"
                  }`}
                  onClick={() => setSelectedCategory("all")}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                      selectedCategory === category.id.toString()
                        ? "bg-[#00EAF0] text-[#051119] font-medium"
                        : "bg-[#0A2331] text-white hover:bg-[#13465D]"
                    }`}
                    onClick={() => setSelectedCategory(category.id.toString())}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items */}
            {Object.keys(byCategory).length === 0 ? (
              <div className="bg-[#0A2331] rounded-lg p-8 text-center">
                <h3 className="text-xl font-medium mb-2 text-[#00EAF0]">
                  No items found
                </h3>
                <p className="text-gray-400">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <motion.div
                className="space-y-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {Object.entries(byCategory).map(
                  ([categoryName, categoryItems]) => {
                    // Get the active subcategory for this category
                    const activeSubcategory =
                      activeSubcategories[categoryName] || "All";
                    // Get all subcategories for this category
                    const subcategories = categorySubcategories[
                      categoryName
                    ] || ["All"];

                    // Filter items by active subcategory
                    const filteredCategoryItems =
                      activeSubcategory === "All"
                        ? categoryItems
                        : categoryItems.filter(
                            (item) => item.subcategory === activeSubcategory
                          );

                    return (
                      <div key={categoryName}>
                        <h2 className="text-xl font-bold mb-2 border-b border-[#13465D] pb-2 text-[#00EAF0]">
                          {categoryName}
                        </h2>

                        {/* Show subcategory tabs if there are subcategories */}
                        {subcategories.length > 1 && (
                          <div className="flex overflow-x-auto hide-scrollbar py-2 mb-4 gap-2">
                            {subcategories.map((subcategory) => (
                              <button
                                key={subcategory}
                                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                                  activeSubcategory === subcategory
                                    ? "bg-[#00EAF0] text-[#051119] font-medium"
                                    : "bg-[#0A2331] text-white hover:bg-[#13465D]"
                                }`}
                                onClick={() =>
                                  setActiveSubcategories((prev) => ({
                                    ...prev,
                                    [categoryName]: subcategory,
                                  }))
                                }
                              >
                                {subcategory}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="space-y-3">
                          {filteredCategoryItems.map((item) => (
                            <motion.div
                              key={item.id}
                              className={`bg-[#0D3446] rounded-lg overflow-hidden flex flex-col sm:flex-row ${
                                !item.isAvailable ? "opacity-60" : ""
                              }`}
                              variants={itemVariants}
                              whileHover={
                                item.isAvailable ? { scale: 1.01 } : undefined
                              }
                            >
                              {item.imageUrl && (
                                <div className="sm:w-1/3 h-40 sm:h-auto relative">
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        "https://placehold.co/400x400/213555/e0f4ff?text=No+Image";
                                    }}
                                  />
                                  {!item.isAvailable && (
                                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                      <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
                                        Unavailable
                                      </span>
                                    </div>
                                  )}
                                  {/* Display first tag as badge if it exists */}
                                  {item.tags && item.tags.length > 0 && (
                                    <span className="absolute top-2 left-2 bg-[#00EAF0] text-[#051119] px-2 py-1 rounded-full text-xs font-medium">
                                      {item.tags[0]}
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className={`p-4 flex flex-col justify-between flex-1 ${
                                !item.imageUrl ? "sm:w-full" : "sm:w-2/3"
                              }`}>
                                <div className="flex justify-between items-start mb-1">
                                  <h3 className="font-bold text-[#00EAF0]">
                                    {item.name}
                                  </h3>
                                  <div>
                                    {hasHalfPortionPrice(item) ? (
                                      <div className="flex flex-col items-end">
                                        <div className="flex items-center">
                                          <span className="text-sm text-[#84F0F5] mr-2">Full</span>
                                          <span className="font-bold text-lg text-[#00EAF0]">
                                            {formatPrice(item.fullPrice)}
                                          </span>
                                        </div>
                                        <div className="flex items-center mt-1">
                                          <span className="text-sm text-[#84F0F5] mr-2">Half</span>
                                          <span className="font-bold text-[#00EAF0]">
                                            {formatPrice(item.halfPrice || 0)}
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="font-bold text-lg text-[#00EAF0]">
                                        {formatPrice(item.fullPrice)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <div>
                                  {item.subcategory && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#13465D] text-gray-300">
                                      {item.subcategory}
                                    </span>
                                  )}
                                  
                                  {item.description && (
                                    <p className="text-gray-300 text-sm mt-1 line-clamp-2">
                                      {item.description}
                                    </p>
                                  )}
                                 
                                  <p className="text-sm text-[#84F0F5] mb-2">
                                    Preparation time: {item.preparationTime} mins
                                  </p>
                                  
                                  {/* Display additional tags */}
                                  {item.tags && item.tags.length > 1 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {item.tags.slice(1, 4).map((tag) => (
                                        <span
                                          key={tag}
                                          className="text-xs px-2 py-0.5 rounded-full bg-[#13465D] text-[#84F0F5]"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                      {item.tags.length > 4 && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#13465D] text-[#84F0F5]">
                                          +{item.tags.length - 4} more
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Add to cart button with quantity controls */}
                                <div className="flex gap-2 mt-1">
                                  {item.isAvailable &&
                                    menu?.isAcceptingOrders && (
                                      <div className="flex flex-col gap-2 w-full">
                                        {/* Order buttons with integrated quantity controls */}
                                        <div className="flex gap-2">
                                          {hasHalfPortionPrice(item) ? (
                                            <>
                                              {/* Half Portion Button */}
                                              <motion.div
                                                className="flex-1 flex items-center justify-between bg-amber-600 rounded-lg overflow-hidden"
                                                whileTap={{ scale: 0.98 }}
                                              >
                                                <motion.button
                                                  className="w-10 h-10 flex items-center justify-center hover:bg-amber-700 transition-colors duration-200"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    decrementHalfQuantity(
                                                      item.id
                                                    );
                                                  }}
                                                >
                                                  <Minus className="h-4 w-4 text-white" />
                                                </motion.button>

                                                <motion.button
                                                  className="flex-1 px-2 py-2 text-sm font-medium text-white"
                                                  onClick={() => {
                                                    // Reset quantity in UI only - cart is already updated
                                                    setHalfPortionQuantities(
                                                      (prev) => ({
                                                        ...prev,
                                                        [item.id]: 0,
                                                      })
                                                    );
                                                    // Refresh cart data
                                                    if (table)
                                                      fetchCartData(table.id);
                                                  }}
                                                  whileTap={{
                                                    backgroundColor: "#92400e",
                                                  }}
                                                  disabled={
                                                    !halfPortionQuantities[
                                                      item.id
                                                    ]
                                                  }
                                                >
                                                  <div className="flex flex-col items-center">
                                                    <span>ORDER HALF</span>
                                                    <span className="text-xs text-white/90">
                                                      {halfPortionQuantities[
                                                        item.id
                                                      ] || ""}
                                                    </span>
                                                  </div>
                                                </motion.button>

                                                <motion.button
                                                  className="w-10 h-10 flex items-center justify-center hover:bg-amber-700 transition-colors duration-200"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    incrementHalfQuantity(
                                                      item.id
                                                    );
                                                  }}
                                                >
                                                  <Plus className="h-4 w-4 text-white" />
                                                </motion.button>
                                              </motion.div>

                                              {/* Full Portion Button */}
                                              <motion.div
                                                className="flex-1 flex items-center justify-between bg-[#00EAF0] rounded-lg overflow-hidden"
                                                whileTap={{ scale: 0.98 }}
                                              >
                                                <motion.button
                                                  className="w-10 h-10 flex items-center justify-center hover:bg-[#00A0A8] transition-colors duration-200"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    decrementQuantity(item.id);
                                                  }}
                                                >
                                                  <Minus className="h-4 w-4 text-[#051119]" />
                                                </motion.button>

                                                <motion.button
                                                  className="flex-1 px-2 py-2 text-sm font-medium text-[#051119]"
                                                  onClick={() => {
                                                    setItemQuantities((prev) => ({
                                                      ...prev,
                                                      [item.id]: 0,
                                                    }));
                                                    if (table)
                                                      fetchCartData(table.id);
                                                  }}
                                                  whileTap={{
                                                    backgroundColor: "#00B0B8",
                                                  }}
                                                  disabled={
                                                    !itemQuantities[item.id]
                                                  }
                                                >
                                                  <div className="flex flex-col items-center">
                                                    <span>ORDER FULL</span>
                                                    <span className="text-xs text-[#051119]/90">
                                                      {itemQuantities[item.id] || ""}
                                                    </span>
                                                  </div>
                                                </motion.button>

                                                <motion.button
                                                  className="w-10 h-10 flex items-center justify-center hover:bg-[#00A0A8] transition-colors duration-200"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    incrementQuantity(item.id);
                                                  }}
                                                >
                                                  <Plus className="h-4 w-4 text-[#051119]" />
                                                </motion.button>
                                              </motion.div>
                                            </>
                                          ) : (
                                            /* Single Order Button for items without half portions */
                                            <motion.div
                                              className="w-full flex items-center justify-between bg-[#00EAF0] rounded-lg overflow-hidden"
                                              whileTap={{ scale: 0.98 }}
                                            >
                                              <motion.button
                                                className="w-10 h-10 flex items-center justify-center hover:bg-[#00A0A8] transition-colors duration-200"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  decrementQuantity(item.id);
                                                }}
                                              >
                                                <Minus className="h-4 w-4 text-[#051119]" />
                                              </motion.button>

                                              <motion.button
                                                className="flex-1 px-2 py-2 text-sm font-medium text-[#051119]"
                                                onClick={() => {
                                                  setItemQuantities((prev) => ({
                                                    ...prev,
                                                    [item.id]: 0,
                                                  }));
                                                  if (table)
                                                    fetchCartData(table.id);
                                                }}
                                                whileTap={{
                                                  backgroundColor: "#00B0B8",
                                                }}
                                                disabled={
                                                  !itemQuantities[item.id]
                                                }
                                              >
                                                <div className="flex flex-col items-center">
                                                  <span>ORDER</span>
                                                  <span className="text-xs text-[#051119]/90">
                                                    {itemQuantities[item.id] || ""}
                                                  </span>
                                                </div>
                                              </motion.button>

                                              <motion.button
                                                className="w-10 h-10 flex items-center justify-center hover:bg-[#00A0A8] transition-colors duration-200"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  incrementQuantity(item.id);
                                                }}
                                              >
                                                <Plus className="h-4 w-4 text-[#051119]" />
                                              </motion.button>
                                            </motion.div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {/* Unavailable button */}
                                  {!item.isAvailable && (
                                    <button
                                      className="w-full px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-700/50 text-gray-400 cursor-not-allowed transition-colors"
                                      disabled
                                    >
                                      Unavailable
                                    </button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                )}
              </motion.div>
            )}
          </motion.div>
        ) : activeTab === "orders" ? (
          <motion.div
            key="orders"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="container mx-auto px-4 py-6 mb-24"
          >
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">Your Orders</h2>
              <p className="text-gray-400 text-sm">
                Track the status of your orders in real-time
              </p>
            </div>

            {orders.length === 0 ? (
              <div className="bg-zinc-800/50 rounded-lg p-8 text-center">
                <Clock className="h-12 w-12 mx-auto text-gray-500 mb-4" />
                <h3 className="text-xl font-medium mb-2">No active orders</h3>
                <p className="text-gray-400">
                  Your orders will appear here once you place them
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    layoutId={`order-${order.id}`}
                    className="bg-zinc-800 rounded-lg overflow-hidden"
                  >
                    <div className="border-b border-zinc-700 p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="font-bold text-lg mr-2">
                            Order #{order.id}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${order.statusColor}`}
                          >
                            {order.statusText}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          {formatTimeElapsed(order.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Order Progress Tracker */}
                    <div className="p-4">
                      <div className="relative">
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-zinc-700 rounded"></div>
                        <div className="flex justify-between relative z-10">
                          {/* Received */}
                          <div
                            className={`flex flex-col items-center ${
                              [
                                "PENDING",
                                "PREPARING",
                                "READY",
                                "DELIVERED",
                              ].includes(order.status)
                                ? "text-blue-500"
                                : "text-gray-500"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                [
                                  "PENDING",
                                  "PREPARING",
                                  "READY",
                                  "DELIVERED",
                                ].includes(order.status)
                                  ? "bg-blue-500"
                                  : "bg-zinc-700"
                              }`}
                            >
                              <CheckCircle className="h-4 w-4 text-black" />
                            </div>
                            <span className="mt-2 text-xs font-medium">
                              Received
                            </span>
                          </div>

                          {/* Preparing */}
                          <div
                            className={`flex flex-col items-center ${
                              ["PREPARING", "READY", "DELIVERED"].includes(
                                order.status
                              )
                                ? "text-amber-500"
                                : "text-gray-500"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                ["PREPARING", "READY", "DELIVERED"].includes(
                                  order.status
                                )
                                  ? "bg-amber-500"
                                  : "bg-zinc-700"
                              }`}
                            >
                              <Utensils className="h-4 w-4 text-black" />
                            </div>
                            <span className="mt-2 text-xs font-medium">
                              Preparing
                            </span>
                          </div>

                          {/* Ready */}
                          <div
                            className={`flex flex-col items-center ${
                              ["READY", "DELIVERED"].includes(order.status)
                                ? "text-green-500"
                                : "text-gray-500"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                ["READY", "DELIVERED"].includes(order.status)
                                  ? "bg-green-500"
                                  : "bg-zinc-700"
                              }`}
                            >
                              <CheckCircle className="h-4 w-4 text-black" />
                            </div>
                            <span className="mt-2 text-xs font-medium">
                              Ready
                            </span>
                          </div>

                          {/* Delivered */}
                          <div
                            className={`flex flex-col items-center ${
                              order.status === "DELIVERED"
                                ? "text-purple-500"
                                : "text-gray-500"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                order.status === "DELIVERED"
                                  ? "bg-purple-500"
                                  : "bg-zinc-700"
                              }`}
                            >
                              <Truck className="h-4 w-4 text-black" />
                            </div>
                            <span className="mt-2 text-xs font-medium">
                              Delivered
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Current Status with Animation */}
                      <div
                        className={`mt-6 flex items-center p-3 rounded-lg ${order.statusColor}`}
                      >
                        <motion.div
                          initial={{ scale: 1 }}
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="mr-3"
                        >
                          {order.icon}
                        </motion.div>
                        <div>
                          <h4 className="font-medium">{order.statusText}</h4>
                          <p className="text-xs mt-1 opacity-80">
                            {order.status === "PENDING" &&
                              "Your order has been received and will be prepared soon."}
                            {order.status === "PREPARING" &&
                              "Our chefs are preparing your delicious meal right now."}
                            {order.status === "READY" &&
                              "Your order is ready! Please pick it up from the counter."}
                            {order.status === "DELIVERED" &&
                              "Your order has been delivered. Enjoy your meal!"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="border-t border-zinc-700 p-4">
                      <h4 className="font-medium mb-2">Order Items</h4>
                      <ul className="space-y-2">
                        {order.orderItems.map((item) => (
                          <li
                            key={item.id}
                            className="flex justify-between text-sm"
                          >
                            <span>
                              {item.quantity}x{" "}
                              {item.item?.name || `Item #${item.itemId}`}
                            </span>
                            <span className="text-gray-400">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex justify-between font-medium mt-4 pt-3 border-t border-zinc-700">
                        <span>Total</span>
                        <span>{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="info"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="container mx-auto px-4 py-6 mb-24"
          >
            <div className="bg-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 border-b border-zinc-700 pb-2">
                Restaurant Information
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-gray-400 text-sm mb-1">Table</h3>
                  <p className="font-medium">Table #{tableNumber}</p>
                  {table?.location && (
                    <p className="text-sm text-gray-300 mt-1">
                      Location: {table.location}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="text-gray-400 text-sm mb-1">Menu</h3>
                  <p className="font-medium">{menu?.name}</p>
                  {menu?.description && (
                    <p className="text-sm text-gray-300 mt-1">
                      {menu.description}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="text-gray-400 text-sm mb-1">Hours</h3>
                  <div className="space-y-1">
                    <p className="text-sm">
                      Opening Hours: 11:00 AM - 11:00 PM
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-gray-400 text-sm mb-1">Contact</h3>
                  <p className="text-sm">Phone: 78377-11322</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Redesigned Sticky Footer */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-[#051119] transition-all duration-500 ease-in-out z-50 ${
          showFullFooter ? "h-auto" : "h-16"
        }`}
        style={{
          boxShadow: "0 -8px 16px rgba(0, 0, 0, 0.5)",
          borderTop: "1px solid rgba(0, 234, 240, 0.15)",
        }}
      >
        {/* Main Footer Content */}
        <div className="container mx-auto px-4">
          {/* Logo and Name Section - Always Visible */}
          <div className="flex items-center justify-between h-16">
            {/* Logo and Name */}
            <div className="flex items-center space-x-3">
              <div
                className="flex-shrink-0"
                style={{ width: "auto", height: "42px" }}
              >
                <img
                  src="/logo.png"
                  alt="Skybar Cafe and Lounge"
                  className="h-full w-auto object-contain"
                  style={{ maxWidth: "none" }}
                />
              </div>
            </div>

            {/* Toggle Button */}
            <button
              onClick={() => setShowFullFooter(!showFullFooter)}
              className="rounded-full bg-[#0A2331] hover:bg-[#13465D] p-2 transition-all duration-300"
            >
              <motion.div
                animate={{ rotate: showFullFooter ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronLeft className="h-4 w-4 text-[#00EAF0]" />
              </motion.div>
            </button>
          </div>

          {/* Expanded Content */}
          <motion.div
            initial={false}
            animate={{
              height: showFullFooter ? "auto" : 0,
              opacity: showFullFooter ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="py-4 border-t border-[#13465D]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Location */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-[#0D3446] flex items-center justify-center flex-shrink-0">
                    <span className="text-[#00EAF0]">📍</span>
                  </div>
                  <div className="text-gray-200">
                    <div className="text-xs uppercase tracking-wider text-[#00EAF0] mb-1">
                      Our Location
                    </div>
                    <div className="font-medium">
                      DC Complex, Royal City, Chahal Road, Faridkot, Punjab
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-[#0D3446] flex items-center justify-center flex-shrink-0">
                    <span className="text-[#00EAF0]">📞</span>
                  </div>
                  <div className="text-gray-200">
                    <div className="text-xs uppercase tracking-wider text-[#00EAF0] mb-1">
                      Call Us
                    </div>
                    <div className="font-medium">78377-11322</div>
                  </div>
                </div>
              </div>

              {/* Additional Info: Hours & Socials */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Hours */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-[#0D3446] flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-[#00EAF0]" />
                  </div>
                  <div className="text-gray-200">
                    <div className="text-xs uppercase tracking-wider text-[#00EAF0] mb-1">
                      Opening Hours
                    </div>
                    <div className="font-medium text-sm">
                      11:00 AM - 11:00 PM (Mon-Sun)
                    </div>
                  </div>
                </div>

                {/* Social Icons - For visual appeal */}
                <div className="flex items-center justify-start md:justify-end space-x-4">
                  <a
                    href="https://www.facebook.com/people/SkyBar-CafeLounge/61574428375511/?ref=ig_profile_ac"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-[#0D3446] hover:bg-[#13465D] flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Facebook className="h-4 w-4 text-[#00EAF0]" />
                  </a>
                  <a
                    href="https://www.instagram.com/skybar_cafe_lounge/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-[#0D3446] hover:bg-[#13465D] flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Instagram className="h-4 w-4 text-[#00EAF0]" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Cart component - only render if menu is accepting orders */}
      {menu?.isAcceptingOrders && (
        <CartComponent
          tableId={table?.id}
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          onCartUpdate={handleCartUpdate}
        />
      )}
    </div>
  );
}
