import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Wifi,
  WifiOff,
} from "lucide-react";
import { WaiterLayout } from "../../components/layout/WaiterLayout";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { ordersApi, WaiterOrder } from "../../lib/api/orders";
import { toast } from "sonner";
import { useSocket } from "../../lib/SocketContext";

// Define an interface for orders with table name
interface DisplayOrder extends WaiterOrder {
  tableName: string;
}

// Define status to tab mapping
const statusToTab: Record<string, string> = {
  PENDING: "pending",
  PREPARING: "preparing",
  READY: "ready",
  DELIVERED: "delivered",
  COMPLETED: "delivered",
  CANCELLED: "cancelled",
};

export default function WaiterPage() {
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState({
    pending: 0,
    preparing: 0,
    ready: 0,
    delivered: 0,
  });

  // Set up socket listeners for real-time updates
  useEffect(() => {
    // Listen for order status changes
    socket.on("order:status-change", (updatedOrder) => {
      // Transform for display with table name
      const displayOrder = {
        ...updatedOrder,
        tableName: updatedOrder.table
          ? `Table ${updatedOrder.table.tableNumber}`
          : `Table ID: ${updatedOrder.tableId}`,
      };

      const targetStatus = updatedOrder.status as string;
      const statusTab = statusToTab[targetStatus];

      // Show toast notification for all status changes
      toast.info(
        `Order #${updatedOrder.id} status updated to ${updatedOrder.status}`,
        {
          description: `From ${displayOrder.tableName}`,
          action: {
            label: "View",
            onClick: () => setActiveTab(statusTab),
          },
        }
      );

      // Update notification counter for the relevant tab
      if (statusTab && statusTab !== activeTab) {
        setNotifications((prev) => ({
          ...prev,
          [statusTab]: prev[statusTab as keyof typeof prev] + 1,
        }));
      }

      // Update order in the orders array
      setOrders((prevOrders) => {
        const existingOrderIndex = prevOrders.findIndex(
          (order) => order.id === updatedOrder.id
        );

        if (existingOrderIndex >= 0) {
          // Update existing order
          const newOrders = [...prevOrders];
          newOrders[existingOrderIndex] = displayOrder;
          return newOrders;
        } else {
          // Add new order
          return [displayOrder, ...prevOrders];
        }
      });
    });

    socket.on("order:new-order", (newOrder) => {
      // Transform for display with table name
      console.log("newOrder", newOrder);
      const displayOrder = {
        ...newOrder,
        tableName: newOrder.table
          ? `Table ${newOrder.table.tableNumber}`
          : `Table ID: ${newOrder.tableId}`,
      };

      // Show global toast for new order
      toast.success(`New order #${newOrder.id} received!`, {
        description: `From ${displayOrder.tableName}`,
        action: {
          label: "View",
          onClick: () => setActiveTab("pending"),
        },
      });

      // Update notification counter for pending tab if not active
      if (activeTab !== "pending") {
        setNotifications((prev) => ({
          ...prev,
          pending: prev.pending + 1,
        }));
      }

      // Add to orders array if not already there
      setOrders((prevOrders) => {
        if (!prevOrders.some((order) => order.id === newOrder.id)) {
          return [displayOrder, ...prevOrders];
        }
        return prevOrders;
      });
    });

    // Clean up listeners when component unmounts
    return () => {
      socket.off("order:status-change");
      socket.off("order:new-order");
    };
  }, [socket, activeTab]);

  // Reset notification counter when changing tabs
  useEffect(() => {
    setNotifications((prev) => ({
      ...prev,
      [activeTab]: 0,
    }));
  }, [activeTab]);

  // Fetch orders on mount and when tab changes
  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      // Get orders from the API
      const dashboardData = await ordersApi.getWaiterDashboardOrders();

      // Combine and transform orders for display
      const allOrders = [
        ...dashboardData.activeOrders,
        ...dashboardData.completedOrders,
      ]
        .map((order) => ({
          ...order,
          tableName: order.table
            ? `Table ${order.table.tableNumber}`
            : `Table ID: ${order.tableId}`,
        }))
        // Sort by created date, newest first
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      setOrders(allOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // Filter orders based on active tab
  const filtered = orders.filter((order) => {
    if (activeTab === "pending") return order.status === "PENDING";
    if (activeTab === "preparing") return order.status === "PREPARING";
    if (activeTab === "ready") return order.status === "READY";
    if (activeTab === "delivered")
      return order.status === "DELIVERED" || order.status === "COMPLETED";
    return true;
  });
  const filteredOrders = [...filtered].sort((a, b) => {
    if (activeTab === "all") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return a.status.localeCompare(b.status);
  });

  // Handle updating order status
  const handleUpdateOrderStatus = async (
    orderId: number,
    newStatus: WaiterOrder["status"]
  ) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      // Emit the status change via socket
      socket.emit("order:status-change", { orderId, newStatus });

      toast.success(`Order #${orderId} status updated`);
    } catch (error) {
      console.error(`Error updating order ${orderId} status:`, error);
      toast.error("Failed to update order status");
    }
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

  // Format price to currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  // Print KOT handler
  const handlePrintKOT = (order: DisplayOrder) => {
    const printWindow = window.open('', '', 'width=400,height=600');
    if (!printWindow) return;
    const itemsHtml = order.orderItems.map(
      (item) =>
        `<tr>
          <td style="padding:4px 8px;">${item.quantity}x</td>
          <td style="padding:4px 8px;">${item.item?.name || `Item #${item.itemId}`}</td>
        </tr>`
    ).join('');
    printWindow.document.write(`
      <html>
        <head>
          <title>KOT - Table ${order.table?.tableNumber || order.tableId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; }
            h2 { margin-bottom: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            td { font-size: 16px; }
            .kot-header { font-size: 20px; font-weight: bold; margin-bottom: 8px; }
            .kot-meta { margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <div class="kot-header">KITCHEN ORDER TICKET (KOT)</div>
          <div class="kot-meta"><strong>Table:</strong> ${order.table?.tableNumber || order.tableId}</div>
          <div class="kot-meta"><strong>Order #:</strong> ${order.id}</div>
          <table>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div style="margin-top:24px; font-size:12px;">Printed at: ${new Date().toLocaleString()}</div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <WaiterLayout>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Waiter Dashboard</h1>
        <p className="text-muted-foreground">Manage customer orders</p>
      </header>

      <div className="flex justify-end mb-4 items-center gap-3">
        {isConnected ? (
          <Badge
            variant="outline"
            className="border-green-500 bg-green-50 text-green-700 flex items-center gap-1 animate-pulse"
          >
            <div className="relative">
              <Wifi className="h-3 w-3" />
              <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-green-500 animate-ping"></span>
            </div>
            Live Updates
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-red-500 bg-red-50 text-red-700 flex items-center gap-1"
          >
            <WifiOff className="h-3 w-3" />
            Offline
          </Badge>
        )}
        <Button onClick={fetchOrders} variant="outline" size="sm">
          Refresh Orders
        </Button>
      </div>

      <Tabs
        defaultValue="pending"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="mb-8">
          <TabsTrigger value="pending" className="relative">
            Pending Orders
            {(orders.filter((o) => o.status === "PENDING").length > 0 ||
              notifications.pending > 0) && (
                <Badge className="ml-2 bg-primary">
                  {orders.filter((o) => o.status === "PENDING").length}
                  {notifications.pending > 0 && (
                    <span className="ml-1 px-1 py-0.5 text-[10px] bg-red-500 rounded-full">
                      +{notifications.pending}
                    </span>
                  )}
                </Badge>
              )}
          </TabsTrigger>
          <TabsTrigger value="preparing" className="relative">
            In Preparation
            {(orders.filter((o) => o.status === "PREPARING").length > 0 ||
              notifications.preparing > 0) && (
                <Badge className="ml-2 bg-amber-500">
                  {orders.filter((o) => o.status === "PREPARING").length}
                  {notifications.preparing > 0 && (
                    <span className="ml-1 px-1 py-0.5 text-[10px] bg-red-500 rounded-full">
                      +{notifications.preparing}
                    </span>
                  )}
                </Badge>
              )}
          </TabsTrigger>
          <TabsTrigger value="ready" className="relative">
            Ready to Serve
            {(orders.filter((o) => o.status === "READY").length > 0 ||
              notifications.ready > 0) && (
                <Badge className="ml-2 bg-green-500">
                  {orders.filter((o) => o.status === "READY").length}
                  {notifications.ready > 0 && (
                    <span className="ml-1 px-1 py-0.5 text-[10px] bg-red-500 rounded-full">
                      +{notifications.ready}
                    </span>
                  )}
                </Badge>
              )}
          </TabsTrigger>
          <TabsTrigger value="delivered" className="relative">
            Delivered
            {(orders.filter(
              (o) => o.status === "DELIVERED" || o.status === "COMPLETED"
            ).length > 0 ||
              notifications.delivered > 0) && (
                <Badge className="ml-2 bg-gray-500">
                  {
                    orders.filter(
                      (o) => o.status === "DELIVERED" || o.status === "COMPLETED"
                    ).length
                  }
                  {notifications.delivered > 0 && (
                    <span className="ml-1 px-1 py-0.5 text-[10px] bg-red-500 rounded-full">
                      +{notifications.delivered}
                    </span>
                  )}
                </Badge>
              )}
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
          </div>
        ) : (
          <TabsContent value={activeTab} className="mt-0">
            {filteredOrders.length === 0 ? (
              <div className="bg-muted/20 border rounded-lg p-8 text-center">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No orders found</h3>
                <p className="text-muted-foreground">
                  {activeTab === "pending" &&
                    "There are no pending orders at the moment."}
                  {activeTab === "preparing" &&
                    "No orders are currently being prepared."}
                  {activeTab === "ready" && "No orders are ready to be served."}
                  {activeTab === "delivered" &&
                    "No orders have been delivered yet."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="overflow-hidden h-full flex flex-col">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-xl">
                            Table {order.table?.tableNumber}
                          </CardTitle>
                          <Badge
                            variant={
                              order.status === "PENDING"
                                ? "default"
                                : order.status === "PREPARING"
                                  ? "outline"
                                  : order.status === "READY"
                                    ? "secondary"
                                    : order.status === "DELIVERED"
                                      ? "outline"
                                      : order.status === "COMPLETED"
                                        ? "outline"
                                        : "default"
                            }
                            className={
                              order.status === "PENDING"
                                ? "bg-primary"
                                : order.status === "PREPARING"
                                  ? "border-amber-500 text-amber-500"
                                  : order.status === "READY"
                                    ? "bg-green-500"
                                    : order.status === "DELIVERED"
                                      ? "border-gray-500 text-gray-500"
                                      : order.status === "COMPLETED"
                                        ? "border-green-500 text-green-500"
                                        : ""
                            }
                          >
                            {order.status === "PENDING" && "Pending"}
                            {order.status === "PREPARING" && "Preparing"}
                            {order.status === "READY" && "Ready"}
                            {order.status === "DELIVERED" && "Delivered"}
                            {order.status === "COMPLETED" && "Completed"}
                            {order.status === "CANCELLED" && "Cancelled"}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimeElapsed(order.createdAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-0 flex-grow">
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground">
                            Order #{order.id}
                          </div>
                          <ul className="space-y-1">
                            {order.orderItems.map((item) => (
                              <li
                                key={item.id}
                                className="text-sm flex justify-between"
                              >
                                <span>
                                  {item.quantity}x{" "}
                                  {item.item?.name || `Item #${item.itemId}`}
                                </span>
                                <span className="font-medium">
                                  {formatPrice(item.price * item.quantity)}
                                </span>
                              </li>
                            ))}
                          </ul>
                          <div className="pt-2 flex justify-between font-semibold">
                            <span>Total</span>
                            <span>{formatPrice(order.total)}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-4 flex gap-2 ">
                        {order.status === "PENDING" && (
                          <Button
                            className="w-full"
                            onClick={() =>
                              handleUpdateOrderStatus(order.id, "PREPARING")
                            }
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            Confirm & Prepare
                          </Button>
                        )}
                        {order.status === "PREPARING" && (
                          <Button
                            className="w-full"
                            onClick={() =>
                              handleUpdateOrderStatus(order.id, "READY")
                            }
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark Ready
                          </Button>
                        )}
                        {order.status === "READY" && (
                          <Button
                            className="w-full bg-green-500 hover:bg-green-600"
                            onClick={() =>
                              handleUpdateOrderStatus(order.id, "DELIVERED")
                            }
                          >
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Mark Delivered
                          </Button>
                        )}
                        {order.status === "DELIVERED" && (
                          <Button
                            className="w-full bg-green-500 hover:bg-green-600"
                            onClick={() =>
                              handleUpdateOrderStatus(order.id, "COMPLETED")
                            }
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Complete Order
                          </Button>
                        )}
                        {( (order.status ==="PENDING" || order.status === "DELIVERED") &&
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => handlePrintKOT(order)}
                          >
                            Print KOT
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </WaiterLayout>
  );
}
