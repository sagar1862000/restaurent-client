import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { DeliveredOrdersList } from "../../components/pos/DeliveredOrdersList";
import { OrderDetails } from "../../components/pos/OrderDetails";
import { ReceiptGenerator } from "../../components/pos/ReceiptGenerator";
import { Button } from "../../components/ui/button";
import { HelpCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { ordersApi, PaymentDetails, WaiterOrder } from "../../lib/api/orders";
import { useSocket } from "../../lib/SocketContext";
import { toast } from "sonner";
import { useAuth, Role } from "../../lib/AuthContext";
import { useNavigate } from "react-router-dom";

export default function PosPage() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  
  const [deliveredOrders, setDeliveredOrders] = useState<WaiterOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<WaiterOrder | null>(null);
  const [completedOrder, setCompletedOrder] = useState<WaiterOrder | null>(null);
  const [receiptMode, setReceiptMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printRequested, setPrintRequested] = useState(false);
  
  // Only admin and waiter roles should access this page
  useEffect(() => {
    if (userRole !== Role.ADMIN && userRole !== Role.POS_ADMIN) {
      toast.error("You don't have permission to access the POS system");
      navigate('/dashboard');
    }
  }, [userRole, navigate]);
  
  // Memoized fetchDeliveredOrders function
  const fetchDeliveredOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const orders = await ordersApi.getDeliveredOrders();
      setDeliveredOrders(orders);
    } catch (err) {
      console.error("Error fetching delivered orders:", err);
      setError("Failed to load orders. Please try again.");
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Handle order updates from socket
  const handleOrderUpdate = useCallback((updatedOrder: WaiterOrder) => {
    try {
      if (updatedOrder.status === "DELIVERED") {
        // Check if the order is already in our list
        setDeliveredOrders(prevOrders => {
          if (!prevOrders.some(order => order.id === updatedOrder.id)) {
            toast.info(`New order #${updatedOrder.id} ready for payment!`);
            return [updatedOrder, ...prevOrders];
          }
          return prevOrders;
        });
      } else if (updatedOrder.status === "COMPLETED") {
        // Remove from delivered orders if it exists
        setDeliveredOrders(prevOrders => {
          const orderExists = prevOrders.some(order => order.id === updatedOrder.id);
          
          if (orderExists) {
            // If the currently selected order was completed, clear selection
            if (selectedOrder?.id === updatedOrder.id && !receiptMode) {
              setSelectedOrder(null);
            }
            return prevOrders.filter(order => order.id !== updatedOrder.id);
          }
          return prevOrders;
        });
      }
    } catch (error) {
      console.error("Error handling order update:", error);
    }
  }, [selectedOrder, receiptMode]);
  
  // Listen for socket events for real-time updates
  useEffect(() => {
    // Listen for order status changes
    socket.on("order:status-change", handleOrderUpdate);

    return () => {
      socket.off("order:status-change", handleOrderUpdate);
    };
  }, [socket, handleOrderUpdate]);
  
  // Initial data fetch and refresh interval
  useEffect(() => {
    fetchDeliveredOrders();
    
    // Refresh orders every 2 minutes as a backup to real-time updates
    const interval = setInterval(fetchDeliveredOrders, 120000);
    return () => clearInterval(interval);
  }, [fetchDeliveredOrders]);
  
  // Log connection status changes
  useEffect(() => {
    if (isConnected) {
      console.log("PosPage: Socket is connected");
    } else {
      console.log("PosPage: Socket is disconnected");
      toast.error("Real-time connection lost. Some updates may be delayed.", {
        id: "pos-socket-disconnection",
        duration: 3000
      });
    }
  }, [isConnected]);

  const handleCompleteOrder = async (orderId: number, paymentDetails: PaymentDetails) => {
    try {
      const response = await ordersApi.completeOrder(orderId, paymentDetails);
      setCompletedOrder(response.order);
      setReceiptMode(true);
      setPrintRequested(true);
      
      // Remove the completed order from the list
      setDeliveredOrders(prevOrders => prevOrders.filter(o => o.id !== orderId));
      
      // Emit status change over socket to notify other clients
      socket.emit("order:status-change", {
        ...response.order,
        status: "COMPLETED"
      });
      
      toast.success(`Order #${orderId} completed successfully`);
      return Promise.resolve();
    } catch (error) {
      console.error("Error completing order:", error);
      toast.error("Failed to complete order. Please try again.");
      return Promise.reject(error);
    }
  };
  
  // Print after receipt is rendered and printRequested is true
  useEffect(() => {
    if (receiptMode && printRequested) {
      // Wait for DOM update
      setTimeout(() => {
        window.print();
        setPrintRequested(false); // Reset
      }, 100);
    }
  }, [receiptMode, printRequested]);
  
  // The printing is now handled directly in the ReceiptGenerator component
  const handlePrintReceipt = () => {
    // This function is kept for backwards compatibility
    // but actual printing is handled by the ReceiptGenerator
  };
  
  const handleNewTransaction = () => {
    setReceiptMode(false);
    setSelectedOrder(null);
    setCompletedOrder(null);
  };
  
  // Global help shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show help with F1 or ?
      if (e.key === 'F1' || (e.shiftKey && e.key === '?')) {
        e.preventDefault();
        const helpButton = document.getElementById('pos-help-button');
        if (helpButton) {
          helpButton.click();
        }
      }
      
      // Refresh with F5
      if (e.key === 'F5') {
        e.preventDefault();
        fetchDeliveredOrders();
      }
      
      // Alt+N to start a new transaction
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        handleNewTransaction();
      }
      
      // Escape to reset if in receipt mode
      if (e.key === 'Escape' && receiptMode) {
        handleNewTransaction();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fetchDeliveredOrders, receiptMode]);
  
  // Show the most recent order in receipt mode
  const orderToDisplay = receiptMode ? (completedOrder || selectedOrder) : selectedOrder;
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">POS System</h1>
            <p className="text-muted-foreground">Manage payments and generate receipts</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" id="pos-help-button">
                <HelpCircle className="h-5 w-5" />
                <span className="sr-only">Keyboard shortcuts</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>POS Keyboard Shortcuts</DialogTitle>
                <DialogDescription>
                  Use these keyboard shortcuts to speed up your workflow
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 items-center gap-4">
                  <div className="text-sm font-medium">Order Selection</div>
                  <div className="text-sm text-muted-foreground">Press <kbd className="px-1.5 py-0.5 text-xs rounded-md bg-muted border">1</kbd> - <kbd className="px-1.5 py-0.5 text-xs rounded-md bg-muted border">9</kbd> to select orders</div>
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <div className="text-sm font-medium">Navigate Orders</div>
                  <div className="text-sm text-muted-foreground">Press <kbd className="px-1.5 py-0.5 text-xs rounded-md bg-muted border">↑</kbd> and <kbd className="px-1.5 py-0.5 text-xs rounded-md bg-muted border">↓</kbd> arrow keys to navigate between orders</div>
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <div className="text-sm font-medium">Payment Methods</div>
                  <div className="text-sm text-muted-foreground">Press <kbd className="px-1.5 py-0.5 text-xs rounded-md bg-muted border">C</kbd> for Cash, <kbd className="px-1.5 py-0.5 text-xs rounded-md bg-muted border">D</kbd> for Card</div>
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <div className="text-sm font-medium">Complete Payment</div>
                  <div className="text-sm text-muted-foreground">Press <kbd className="px-1.5 py-0.5 text-xs rounded-md bg-muted border">Alt</kbd> + <kbd className="px-1.5 py-0.5 text-xs rounded-md bg-muted border">P</kbd></div>
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <div className="text-sm font-medium">Print Receipt</div>
                  <div className="text-sm text-muted-foreground">Press <kbd className="px-1.5 py-0.5 text-xs rounded-md bg-muted border">Alt</kbd> + <kbd className="px-1.5 py-0.5 text-xs rounded-md bg-muted border">P</kbd></div>
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <div className="text-sm font-medium">New Transaction</div>
                  <div className="text-sm text-muted-foreground">Press <kbd className="px-1.5 py-0.5 text-xs rounded-md bg-muted border">Alt</kbd> + <kbd className="px-1.5 py-0.5 text-xs rounded-md bg-muted border">N</kbd> or <kbd className="px-1.5 py-0.5 text-xs rounded-md bg-muted border">Escape</kbd></div>
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <div className="text-sm font-medium">Refresh Orders</div>
                  <div className="text-sm text-muted-foreground">Press <kbd className="px-1.5 py-0.5 text-xs rounded-md bg-muted border">F5</kbd></div>
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <div className="text-sm font-medium">Help</div>
                  <div className="text-sm text-muted-foreground">Press <kbd className="px-1.5 py-0.5 text-xs rounded-md bg-muted border">F1</kbd> or <kbd className="px-1.5 py-0.5 text-xs rounded-md bg-muted border">Shift</kbd> + <kbd className="px-1.5 py-0.5 text-xs rounded-md bg-muted border">?</kbd></div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {loading && deliveredOrders.length === 0 ? (
          <div className="flex items-center justify-center h-[calc(100vh-150px)]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading POS system...</p>
            </div>
          </div>
        ) : error ? (
          <div className="border rounded-lg p-8 flex items-center justify-center h-[calc(100vh-150px)]">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchDeliveredOrders}>Retry</Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Panel: Delivered Orders List */}
            <div className="md:col-span-1">
              <DeliveredOrdersList 
                orders={deliveredOrders}
                loading={loading}
                onOrderSelect={setSelectedOrder}
                selectedOrderId={selectedOrder?.id || null}
                onOrdersUpdate={setDeliveredOrders}
              />
            </div>
            
            {/* Right Panel: Order Details or Receipt */}
            <div className="md:col-span-2">
              {orderToDisplay && !receiptMode && (
                <OrderDetails 
                  order={orderToDisplay}
                  onCompleteOrder={handleCompleteOrder}
                />
              )}
              
              {orderToDisplay && receiptMode && (
                <ReceiptGenerator 
                  order={orderToDisplay}
                  onPrint={handlePrintReceipt}
                  onNewTransaction={handleNewTransaction}
                />
              )}
              
              {!orderToDisplay && (
                <div className="border rounded-lg p-8 flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">Select an order to process payment</p>
                    <p className="text-xs text-muted-foreground">Use number keys 1-9 for quick selection</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 