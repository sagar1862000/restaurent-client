import { useState, useEffect } from "react";
import { WaiterLayout } from "../../components/layout/WaiterLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

import {
  CheckCircle,
  MoreVertical,
  Clock,
  XCircle,
  Search,
  Filter,
  ArrowRight,
  Eye,
} from "lucide-react";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { ordersApi, WaiterOrder } from "../../lib/api/orders";
import { toast } from "sonner";

import { useSocket } from "../../lib/SocketContext";

// Define interface to represent an order with table name for easy display
interface DisplayOrder extends WaiterOrder {
  tableName: string;
}

function OrdersPage() {
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<DisplayOrder | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { socket } = useSocket();

  // Set up socket listeners for real-time updates
  useEffect(() => {
    // Listen for new orders being created
    socket.on("order:status-change", (updatedOrder) => {
      // Transform for display with table name
      const displayOrder = {
        ...updatedOrder,
        tableName: updatedOrder.table
          ? `Table ${updatedOrder.table.number}`
          : `Table ID: ${updatedOrder.tableId}`,
      };

      setOrders((prevOrders) => {
        // Check if the order already exists in our list
        const orderExists = prevOrders.some(
          (order) => order.id === updatedOrder.id
        );

        if (!orderExists) {
          // It's a new order
          toast.info(`New order #${updatedOrder.id} received!`);
          return [displayOrder, ...prevOrders];
        } else {
          // It's an update to an existing order
          toast.info(
            `Order #${updatedOrder.id} status updated to ${updatedOrder.status}!`
          );
          return prevOrders.map((order) =>
            order.id === updatedOrder.id ? displayOrder : order
          );
        }
      });
    });

    // If we get a specific preparing status event
    socket.on("order:status-preparing", (updatedOrder) => {
      // Transform for display with table name
      const displayOrder = {
        ...updatedOrder,
        tableName: updatedOrder.table
          ? `Table ${updatedOrder.table.number}`
          : `Table ID: ${updatedOrder.tableId}`,
      };

      setOrders((prevOrders) => {
        // Check if the order already exists in our list
        const orderExists = prevOrders.some(
          (order) => order.id === updatedOrder.id
        );

        if (!orderExists) {
          toast.info(`New order #${updatedOrder.id} is being prepared!`);
          return [displayOrder, ...prevOrders];
        } else {
          toast.info(`Order #${updatedOrder.id} is now being prepared!`);
          return prevOrders.map((order) =>
            order.id === updatedOrder.id ? displayOrder : order
          );
        }
      });
    });

    socket.on("order:new-order", (newOrder) => {
      // Transform for display with table name
      console.log("newOrder", newOrder);
      const displayOrder = {
        ...newOrder,
        tableName: newOrder.table
          ? `Table ${newOrder.table.number}`
          : `Table ID: ${newOrder.tableId}`,
      };

      toast.success(`New order #${newOrder.id} received!`, {
        description: `From ${displayOrder.tableName}`,
      });

      setOrders((prevOrders) => [displayOrder, ...prevOrders]);
    });

    // Clean up listeners when component unmounts
    return () => {
      socket.off("order:status-change");
      socket.off("order:status-preparing");
      socket.off("order:new-order");
    };
  }, [socket]);

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersApi.getAll();

      // Transform orders for display, ensuring table name is available
      const displayOrders = data.map((order) => ({
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

  // Filter orders based on search and status
  const filtered = orders.filter((order) => {
    const matchesSearch =
      searchQuery === "" ||
      order.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toString().includes(searchQuery);

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredOrders = [...filtered].sort((a, b) => {
    if (statusFilter === "all") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return a.status.localeCompare(b.status);
  });

  // Handle status update
  const handleUpdateStatus = async (
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

      toast.success(`Order #${orderId} status updated`);

      // If we were viewing this order's details, update the selected order too
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: newStatus,
        });
      }
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

  // Get appropriate badge for order status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-primary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "PREPARING":
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-500">
            <Clock className="h-3 w-3 mr-1" />
            Preparing
          </Badge>
        );
      case "READY":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        );
      case "DELIVERED":
        return (
          <Badge variant="outline" className="border-gray-500 text-gray-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Delivered
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge variant="outline" className="border-green-500 text-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <WaiterLayout>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Order Status</h1>
        <p className="text-muted-foreground">Track and manage all orders</p>
      </header>

      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by table or order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="min-w-[180px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PREPARING">Preparing</SelectItem>
              <SelectItem value="READY">Ready</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={fetchOrders} variant="outline">
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-muted/20 border rounded-lg p-8 text-center">
          <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No orders found</h3>
          <p className="text-muted-foreground">
            Try changing your search or filter criteria
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders
                .filter((order) => order.status !== "COMPLETED")
                .map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>{order.tableId}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{order.orderItems.length} items</TableCell>
                    <TableCell>{formatPrice(order.total)}</TableCell>
                    <TableCell>{formatTimeElapsed(order.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDetailsOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {order.status === "PENDING" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUpdateStatus(order.id, "PREPARING")
                                }
                              >
                                <Clock className="h-4 w-4 mr-2" />
                                Mark as Preparing
                              </DropdownMenuItem>
                            )}
                            {order.status === "PREPARING" && (
                              <DropdownMenuItem>
                                Only chef can mark as ready
                              </DropdownMenuItem>
                            )}
                            {order.status === "READY" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUpdateStatus(order.id, "DELIVERED")
                                }
                              >
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Mark as Delivered
                              </DropdownMenuItem>
                            )}
                            {order.status === "DELIVERED" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUpdateStatus(order.id, "COMPLETED")
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark as Completed
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder &&
                `Order #${selectedOrder.id} from ${selectedOrder.tableName}`}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.orderItems.map((item) => (
                    <div key={item.id} className="p-3 flex justify-between">
                      <div>
                        <span className="font-medium">
                          {item.item?.name || `Item #${item.itemId}`}
                        </span>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <span>{formatPrice(item.price * item.quantity)}</span>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(item.price)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <span>{formatPrice(selectedOrder.total)}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Order placed {formatTimeElapsed(selectedOrder.createdAt)}
                </div>
              </div>
              <DialogFooter className="sm:justify-between">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                >
                  Close
                </Button>
                {selectedOrder.status === "PENDING" && (
                  <Button
                    onClick={() => {
                      handleUpdateStatus(selectedOrder.id, "PREPARING");
                      setIsDetailsOpen(false);
                    }}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Mark as Preparing
                  </Button>
                )}
                {selectedOrder.status === "PREPARING" && (
                  <Button
                    onClick={() => {
                      handleUpdateStatus(selectedOrder.id, "READY");
                      setIsDetailsOpen(false);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Ready
                  </Button>
                )}
                {selectedOrder.status === "READY" && (
                  <Button
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => {
                      handleUpdateStatus(selectedOrder.id, "DELIVERED");
                      setIsDetailsOpen(false);
                    }}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Mark as Delivered
                  </Button>
                )}
                {selectedOrder.status === "DELIVERED" && (
                  <Button
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => {
                      handleUpdateStatus(selectedOrder.id, "COMPLETED");
                      setIsDetailsOpen(false);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </WaiterLayout>
  );
}

export default OrdersPage;
