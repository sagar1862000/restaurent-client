import { useState, useEffect, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { WaiterOrder, ordersApi } from "../../lib/api/orders";
import { format, isAfter, subHours, startOfDay, endOfDay } from "date-fns";
import { Loader2, Calendar, RefreshCw } from "lucide-react";
import { useSocket } from "../../lib/SocketContext";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Simple DatePicker component
function DatePicker({
  date,
  onSelect,
}: {
  date?: Date;
  onSelect: (date?: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback(
    (newDate: Date | null) => {
      onSelect(newDate || undefined);
      setOpen(false);
    },
    [onSelect]
  );

  // Close datepicker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <Button
        variant="outline"
        className="w-[200px] justify-start text-left font-normal"
        onClick={() => setOpen(!open)}
      >
        <Calendar className="mr-2 h-4 w-4" />
        {date ? format(date, "MMM d, yyyy") : <span>Pick a date</span>}
      </Button>
      
      {open && (
        <div className="absolute z-50 mt-2 bg-white shadow-lg rounded-md border border-gray-200" style={{ left: '0' }}>
          <ReactDatePicker
            selected={date}
            onChange={handleSelect}
            inline
            calendarClassName="react-datepicker-calendar"
            dayClassName={() => "text-center"}
          />
        </div>
      )}
    </div>
  );
}

interface DeliveredOrdersListProps {
  orders?: WaiterOrder[]; // Make orders optional since we'll fetch directly
  loading?: boolean; // Make loading optional since we'll manage loading state
  onOrderSelect: (order: WaiterOrder | null) => void;
  selectedOrderId: number | null;
  onOrdersUpdate?: (updatedOrders: WaiterOrder[]) => void;
  onOrderCompletionChange?: (isCompleted: boolean) => void;
}

export function DeliveredOrdersList({
  orders: initialOrders,
  loading: initialLoading = false,
  onOrderSelect,
  selectedOrderId,
  onOrdersUpdate,
  onOrderCompletionChange,
}: DeliveredOrdersListProps) {
  const [orders, setOrders] = useState<WaiterOrder[]>(initialOrders || []);
  const [loading, setLoading] = useState<boolean>(initialLoading);
  const listRef = useRef<HTMLUListElement>(null);
  const { socket, isConnected } = useSocket();
  const [currentFocusIndex, setCurrentFocusIndex] = useState<number>(-1);
  const [tabValue, setTabValue] = useState<string>("recent");
  const [receiptMode, setReceiptMode] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [fetchingAll, setFetchingAll] = useState<boolean>(false);

  useEffect(() => {
    fetchOrders();
  }, [tabValue]);

  // Fetch orders function
  const fetchOrders = async () => {
    try {
      setLoading(true);
      let fetchedOrders: WaiterOrder[] = [];

      const delivered = await ordersApi.getByStatus("DELIVERED");
      const completed = await ordersApi.getByStatus("COMPLETED");
      fetchedOrders = [...delivered, ...completed];
      console.log("fetchedOrders", fetchedOrders);

      setOrders(fetchedOrders);
      // Notify parent if callback exists
      if (onOrdersUpdate) {
        onOrdersUpdate(fetchedOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // Filter orders for Recent tab (last 2 hours)
  const recentOrders = orders.filter((order) => {
    const orderTime = new Date(order.createdAt);
    const twoHoursAgo = subHours(new Date(), 2);
    return isAfter(orderTime, twoHoursAgo) && order.status === "DELIVERED";
  });

  // Filter orders for All tab based on selected date
  const dateFilteredOrders = orders.filter((order) => {
    if (!selectedDate) return true;

    const orderTime = new Date(order.createdAt);
    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);

    return orderTime >= dayStart && orderTime <= dayEnd;
  });

  // Decide which orders to display based on active tab
  const displayedOrders =
    tabValue === "recent" ? recentOrders : dateFilteredOrders;

  // Custom onOrderSelect handler that also notifies about order completion status
  const handleOrderSelect = useCallback(
    (order: WaiterOrder | null) => {
      onOrderSelect(order);

      // Notify parent about completion status if handler exists
      if (order && onOrderCompletionChange) {
        const isCompleted = order.status === "COMPLETED";
        onOrderCompletionChange(isCompleted);
      }
    },
    [onOrderSelect, onOrderCompletionChange]
  );

  // Function to handle order updates from socket events
  const handleOrderUpdate = useCallback(
    (updatedOrder: WaiterOrder) => {
      try {
        // Check if this is a DELIVERED order that we need to add
        if (updatedOrder.status === "DELIVERED") {
          // Check if order already exists in our list
          const orderExists = orders.some(
            (order) => order.id === updatedOrder.id
          );

          if (!orderExists) {
            // New delivered order arrived - add it to the list
            toast.info(`New order #${updatedOrder.id} is ready for payment!`);

            const newOrders = [updatedOrder, ...orders];
            setOrders(newOrders);

            if (onOrdersUpdate) {
              onOrdersUpdate(newOrders);
            }
          }
        } else if (updatedOrder.status === "COMPLETED") {
          // If in All tab, update the order; if in Recent tab, remove it
          if (tabValue === "all") {
            const updatedOrders = orders.map((order) =>
              order.id === updatedOrder.id ? updatedOrder : order
            );
            setOrders(updatedOrders);

            if (onOrdersUpdate) {
              onOrdersUpdate(updatedOrders);
            }

            // If this is the currently selected order, update the completion status
            if (
              selectedOrderId === updatedOrder.id &&
              onOrderCompletionChange
            ) {
              onOrderCompletionChange(true);
            }
          } else {
            // In Recent tab, remove completed orders
            const updatedOrders = orders.filter(
              (order) => order.id !== updatedOrder.id
            );
            setOrders(updatedOrders);

            // If the currently selected order was completed, clear selection
            if (selectedOrderId === updatedOrder.id) {
              onOrderSelect(updatedOrders[0] || null);
              setCurrentFocusIndex(updatedOrders.length > 0 ? 0 : -1);

              if (onOrderCompletionChange) {
                onOrderCompletionChange(false);
              }
            }

            if (onOrdersUpdate) {
              onOrdersUpdate(updatedOrders);
            }
          }
        }
      } catch (error) {
        console.error("Error handling order update:", error);
      }
    },
    [
      orders,
      selectedOrderId,
      onOrderSelect,
      onOrdersUpdate,
      tabValue,
      onOrderCompletionChange,
    ]
  );

  // Set up socket listeners for real-time updates
  useEffect(() => {
    // Listen for order status changes
    socket.on("order:status-change", handleOrderUpdate);

    // Cleanup function
    return () => {
      socket.off("order:status-change", handleOrderUpdate);
    };
  }, [socket, handleOrderUpdate]);

  // Update current focus index when selectedOrderId changes
  useEffect(() => {
    if (selectedOrderId) {
      const index = displayedOrders.findIndex(
        (order) => order.id === selectedOrderId
      );
      if (index !== -1) {
        setCurrentFocusIndex(index);

        // Also update the completion status
        if (onOrderCompletionChange) {
          const selectedOrder = displayedOrders.find(
            (order) => order.id === selectedOrderId
          );
          if (selectedOrder) {
            onOrderCompletionChange(selectedOrder.status === "COMPLETED");
          }
        }
      }
    } else {
      setCurrentFocusIndex(displayedOrders.length > 0 ? 0 : -1);
    }
  }, [selectedOrderId, displayedOrders, onOrderCompletionChange]);

  // Scroll selected item into view
  useEffect(() => {
    if (currentFocusIndex >= 0 && listRef.current) {
      const listItems = listRef.current.querySelectorAll("li");
      if (listItems && listItems[currentFocusIndex]) {
        listItems[currentFocusIndex].scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [currentFocusIndex]);

  // Enhanced keyboard shortcuts for order selection with arrow navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Avoid handling keys when an input has focus
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Number keys 1-9 for quick selection
      if (/^[1-9]$/.test(e.key)) {
        const orderIndex = parseInt(e.key) - 1;
        if (orderIndex < displayedOrders.length) {
          handleOrderSelect(displayedOrders[orderIndex]);
          setCurrentFocusIndex(orderIndex);
        }
      }

      // Arrow keys for navigation
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); // Prevent page scrolling

        if (displayedOrders.length === 0) return;

        let newIndex = currentFocusIndex;

        if (e.key === "ArrowDown") {
          // Move down in the list
          newIndex =
            currentFocusIndex < displayedOrders.length - 1
              ? currentFocusIndex + 1
              : 0; // Wrap to top
        } else if (e.key === "ArrowUp") {
          // Move up in the list
          newIndex =
            currentFocusIndex > 0
              ? currentFocusIndex - 1
              : displayedOrders.length - 1; // Wrap to bottom
        }

        setCurrentFocusIndex(newIndex);
        handleOrderSelect(displayedOrders[newIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [displayedOrders, handleOrderSelect, currentFocusIndex]);

  // When a component mounts or when connection state changes, check connection
  useEffect(() => {
    if (isConnected) {
      console.log("DeliveredOrdersList: Socket is connected");
    } else {
      console.log("DeliveredOrdersList: Socket is disconnected");
    }
  }, [isConnected]);

  useEffect(() => {
    if (receiptMode) {
      // Wait for the DOM to update, then print
      setTimeout(() => {
        window.print();
      }, 100); // 100ms is usually enough, adjust if needed
    }
  }, [receiptMode]);

  // Handle date change
  const handleDateChange = useCallback((date: Date | undefined) => {
    setSelectedDate(date);
  }, []);

  // Reset date filter
  const handleResetDate = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="border-b px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Delivered Orders</CardTitle>
              <CardDescription>Ready to process payment</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[calc(100vh-260px)]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">
              Delivered Orders
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Ready to process payment
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            className="h-9 px-3 flex items-center gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs
          defaultValue="recent"
          value={tabValue}
          onValueChange={setTabValue}
        >
          <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
            <TabsTrigger
              value="recent"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Recent (2h)
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              All Orders
            </TabsTrigger>
          </TabsList>
          <TabsContent value="recent" className="m-0">
            {recentOrders.length === 0 ? (
              <div className="flex items-center justify-center h-[calc(100vh-300px)]">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">No recent orders</p>
                  <p className="text-xs text-muted-foreground">
                    Orders from the last 2 hours will appear here
                  </p>
                </div>
              </div>
            ) : (
              <ul
                className="divide-y max-h-[calc(100vh-300px)] overflow-auto"
                ref={listRef}
              >
                {recentOrders.map((order, index) => (
                  <li
                    key={order.id}
                    className={`p-4 cursor-pointer transition-colors hover:bg-muted ${
                      selectedOrderId === order.id ? "bg-muted/80" : ""
                    } ${
                      index === currentFocusIndex && tabValue === "recent"
                        ? "ring-2 ring-primary ring-inset"
                        : ""
                    }`}
                    onClick={() => {
                      handleOrderSelect(order);
                      setCurrentFocusIndex(index);
                    }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <span className="px-1.5 py-0.5 text-xs bg-muted rounded mr-2">
                          {index + 1}
                        </span>
                        <span className="font-medium">Order #{order.id}</span>
                      </div>
                      <div className="text-sm">
                        {format(new Date(order.createdAt), "h:mm a")}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Table {order.table?.tableNumber || "Unknown"}
                    </div>
                    <div className="text-sm font-medium">
                      ₹{Number(order.total).toFixed(2)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
          <TabsContent value="all" className="m-0">
            <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
              <DatePicker date={selectedDate} onSelect={handleDateChange} />
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4"
                onClick={handleResetDate}
              >
                Today
              </Button>
            </div>
            {fetchingAll ? (
              <div className="flex items-center justify-center h-[calc(100vh-350px)]">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading all orders...</p>
                </div>
              </div>
            ) : dateFilteredOrders.length === 0 ? (
              <div className="flex items-center justify-center h-[calc(100vh-350px)]">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">No orders found</p>
                  <p className="text-xs text-muted-foreground">
                    Try selecting a different date
                  </p>
                </div>
              </div>
            ) : (
              <ul
                className="divide-y max-h-[calc(100vh-350px)] overflow-auto"
                ref={tabValue === "all" ? listRef : undefined}
              >
                {dateFilteredOrders.map((order, index) => (
                  <li
                    key={order.id}
                    className={`p-4 cursor-pointer transition-colors hover:bg-muted ${
                      selectedOrderId === order.id ? "bg-muted/80" : ""
                    } ${
                      index === currentFocusIndex && tabValue === "all"
                        ? "ring-2 ring-primary ring-inset"
                        : ""
                    }`}
                    onClick={() => {
                      handleOrderSelect(order);
                      setCurrentFocusIndex(index);
                    }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center">
                        <span className="px-1.5 py-0.5 text-xs bg-muted rounded mr-2">
                          {index + 1}
                        </span>
                        <span className="font-medium">Order #{order.id}</span>
                        <span
                          className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                            order.status === "DELIVERED"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="text-sm">
                        {format(new Date(order.createdAt), "MMM d, h:mm a")}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Table {order.table?.tableNumber || "Unknown"}
                    </div>
                    <div className="text-sm font-medium">
                      ₹{Number(order.total).toFixed(2)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
