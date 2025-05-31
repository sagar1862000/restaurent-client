import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  CheckCircle,
  Clock,
  RefreshCw,
  Utensils,
  WifiOff,
  Wifi,
} from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
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
import { toast } from "sonner";
import { ordersApi, WaiterOrder } from "../../lib/api/orders";
import { useSocket } from "../../lib/SocketContext";

// Define interface for orders with table name for display
interface DisplayOrder extends WaiterOrder {
  tableName: string;
}

export default function ChefOrdersPage() {
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket, isConnected } = useSocket();

  // Fetch preparing orders on mount
  useEffect(() => {
    fetchPreparingOrders();
  }, []);

  // Socket event listeners for real-time updates
  useEffect(() => {
    // Listen for new orders with PREPARING status
    socket.on("order:status-preparing", (newOrder) => {
      // Transform for display with table name
      const displayOrder: DisplayOrder = {
        ...newOrder,
        tableName: newOrder.table
          ? `Table ${newOrder.table.number}`
          : `Table ID: ${newOrder.tableId}`,
      };

      // Add to current orders list
      setOrders((prevOrders) => [...prevOrders, displayOrder]);
      toast.info(`New order #${newOrder.id} received for preparation!`);
    });

    // Cleanup function
    return () => {
      socket.off("order:status-preparing");
    };
  }, [socket]);

  const fetchPreparingOrders = async () => {
    try {
      setLoading(true);
      // Get orders with PREPARING status
      const preparingOrders = await ordersApi.getByStatus("PREPARING");

      // Transform for display with table names
      const displayOrders = preparingOrders.map((order) => ({
        ...order,
        tableName: order.table
          ? `Table ${order.table.tableNumber}`
          : `Table ID: ${order.tableId}`,
      }));

      setOrders(displayOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // Mark order as ready
  const markOrderAsReady = async (orderId: number) => {
    try {
      // Update order status to READY
      await ordersApi.updateStatus(orderId, "READY");

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.filter((order) => order.id !== orderId)
      );

      toast.success(`Order #${orderId} is now ready for serving!`);
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

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  // Print KOT handler
  const handlePrintKOT = (order: DisplayOrder) => {
    // Open a small window matching thermal receipt paper size (80mm/3.15in width)
    const printWindow = window.open("", "_blank", "width=302,height=600");
    if (!printWindow) return;
    
    const itemsHtml = order.orderItems
      .map(
        (item) =>
          `<tr>
            <td style="padding:2px; width:25px; text-align:center; font-weight:bold;">${item.quantity}x</td>
            <td style="padding:2px;">${
              item.item?.name || `Item #${item.itemId}`
            }</td>
          </tr>`
      )
      .join("");
      
    printWindow.document.write(`
      <html>
        <head>
          <title>KOT #${order.id}</title>
          <style>
            @page {
              size: 80mm auto;  /* Standard thermal receipt width */
              margin: 0;
            }
            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 8px;
              width: 286px; /* 80mm/3.15in in pixels @96dpi */
              box-sizing: border-box;
              font-size: 12px;
            }
            .kot-header {
              text-align: center;
              font-size: 14px;
              font-weight: bold;
              padding: 4px 0;
              border-bottom: 1px dashed #000;
              margin-bottom: 8px;
            }
            .kot-meta {
              margin-bottom: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 6px 0;
            }
            thead {
              border-bottom: 1px solid #000;
            }
            th {
              text-align: left;
              padding: 2px;
            }
            tr {
              border-bottom: 1px dotted #ccc;
            }
            tr:last-child {
              border-bottom: none;
            }
            .footer {
              margin-top: 10px;
              border-top: 1px dashed #000;
              padding-top: 6px;
              text-align: center;
              font-size: 10px;
            }
          </style>
        </head>
        <body>
          <div class="kot-header">KITCHEN ORDER TICKET</div>
          <div class="kot-meta"><strong>Table:</strong> ${
            order.table?.tableNumber || order.tableId
          }</div>
          <div class="kot-meta"><strong>Order #:</strong> ${order.id}</div>
          <div class="kot-meta"><strong>Time:</strong> ${new Date().toLocaleTimeString()}</div>
          <table>
            <thead>
              <tr>
                <th style="width:25px">Qty</th>
                <th>Item</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="footer">
            ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
          </div>
          <script>
            window.onload = function() {
              // Short delay to ensure proper rendering
              setTimeout(function() {
                window.print();
                // Don't close the window immediately to allow manual printing if needed
                // window.close();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Orders in Preparation</h1>
            <p className="text-muted-foreground">
              Manage and track orders being prepared
            </p>
          </div>
          <div className="flex items-center gap-3">
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
            <Button
              onClick={fetchPreparingOrders}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-muted/20 border rounded-lg p-8 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No orders in preparation</h3>
            <p className="text-muted-foreground">
              There are currently no orders being prepared. Check back later!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
              >
                <Card className="h-full flex flex-col overflow-hidden border-amber-200 shadow-md">
                  <CardHeader className="pb-3 bg-amber-50">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl">
                        Table #{order?.table?.tableNumber}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="border-amber-500 text-amber-700 bg-amber-100"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Preparing
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      Ordered {formatTimeElapsed(order.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-0 flex-grow">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground flex justify-between">
                        <span>Order #{order.id}</span>
                        <span>{order.orderItems.length} items</span>
                      </div>
                      <ul className="space-y-1 max-h-64 overflow-y-auto border rounded-md p-2">
                        {order.orderItems.map((item) => (
                          <li
                            key={item.id}
                            className="text-sm flex justify-between border-b pb-1 last:border-0 last:pb-0 pt-1"
                          >
                            <span className="flex items-center">
                              <Utensils className="h-3 w-3 mr-1 text-muted-foreground" />
                              <span className="font-medium">
                                {item.quantity}x
                              </span>{" "}
                              {item.item?.name || `Item #${item.itemId}`}
                            </span>
                            <span className="text-muted-foreground">
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
                  <CardFooter className="flex gap-2 mt-4 ">
                    <Button
                      className="w-full bg-green-500 hover:bg-green-600"
                      onClick={() => markOrderAsReady(order.id)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Ready
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full "
                      onClick={() => handlePrintKOT(order)}
                    >
                      Print KOT
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
