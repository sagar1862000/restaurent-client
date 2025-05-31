import { useState, useEffect, useRef } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "../ui/card";
import { Button } from "../ui/button";
import { PaymentDetails, WaiterOrder } from "../../lib/api/orders";
import { useSocket } from "../../lib/SocketContext";
import { 
  CreditCard, 
  DollarSign, 
  Receipt, 
  Clipboard,
  CheckCircle2,
  Percent
} from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface OrderDetailsProps {
  order: WaiterOrder;
  onCompleteOrder: (orderId: number, paymentDetails: PaymentDetails) => Promise<void>;
}

export function OrderDetails({ order, onCompleteOrder }: OrderDetailsProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [processing, setProcessing] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState(5); // Default 5% tax
  const [activeKeyCommand, setActiveKeyCommand] = useState<string | null>(null);
  const completeButtonRef = useRef<HTMLButtonElement>(null);
  const { socket } = useSocket();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard shortcuts if not editing an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      
      // Payment method shortcuts
      if (e.key === 'c' || e.key === 'C') {
        setPaymentMethod('cash');
        setActiveKeyCommand('cash');
        setTimeout(() => setActiveKeyCommand(null), 200);
      } else if (e.key === 'd' || e.key === 'D') {
        setPaymentMethod('card');
        setActiveKeyCommand('card');
        setTimeout(() => setActiveKeyCommand(null), 200);
      }
      
      // Complete payment with Alt+P
      if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setActiveKeyCommand('complete');
        setTimeout(() => setActiveKeyCommand(null), 200);
        handleCompletePayment();
        
        // Focus the complete button for visual feedback
        if (completeButtonRef.current) {
          completeButtonRef.current.focus();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [order, paymentMethod]);

  const calculateSubtotal = () => {
    return order.orderItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
  };

  const calculateTaxAmount = () => {
    const subtotal = calculateSubtotal();
    return (subtotal * taxPercentage) / 100;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const taxAmount = calculateTaxAmount();
    return subtotal + taxAmount;
  };

  const handleCompletePayment = async () => {
    if (processing) return;
    
    try {
      setProcessing(true);
      
      const paymentDetails = {
        paymentMethod,
        amountPaid: calculateTotal(),
        taxPercentage: taxPercentage,
        taxAmount: calculateTaxAmount(),
        subtotal: calculateSubtotal(),
        notes: `Payment processed by POS admin for table ${order.table?.tableNumber || 'Unknown'}`
      };
      
      // Notify that payment is being processed
      socket.emit("order:payment-processing", {
        orderId: order.id,
        tableId: order.tableId,
        tableNumber: order.table?.tableNumber
      });
      
      await onCompleteOrder(order.id, paymentDetails);
      
    } catch (error) {
      console.error('Error completing payment:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleTaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setTaxPercentage(isNaN(value) ? 0 : value);
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <CardTitle>Order #{order.id} Details</CardTitle>
          <div className="text-sm text-muted-foreground">
            Table {order.table?.tableNumber || 'Unknown'}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 overflow-auto h-[calc(100vh-300px)]">
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2 flex items-center">
              <Clipboard className="h-4 w-4 mr-2" />
              Order Items
            </h3>
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 pl-3">Item</th>
                    <th className="text-center p-2">Qty</th>
                    <th className="text-right p-2">Price</th>
                    <th className="text-right p-2 pr-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.orderItems.map((item) => (
                    <tr key={item.id} className="border-b last:border-b-0">
                      <td className="p-2 pl-3">
                        <div>
                          <div className="font-medium">{item.item?.name}</div>
                          {item.item?.description && (
                            <div className="text-xs text-muted-foreground mt-0.5">{item.item.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="text-center p-2">{item.quantity}</td>
                      <td className="text-right p-2">₹{Number(item.price).toFixed(2)}</td>
                      <td className="text-right p-2 pr-3">₹{(Number(item.price) * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between py-1">
              <div>Subtotal</div>
              <div>₹{calculateSubtotal().toFixed(2)}</div>
            </div>
            <div className="flex justify-between py-1 items-center">
              <div className="flex items-center gap-2">
                <Label htmlFor="taxPercentage" className="flex items-center">
                  <Percent className="h-4 w-4 mr-1" />
                  Tax
                </Label>
                <div className="w-20">
                  <Input
                    id="taxPercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={taxPercentage}
                    onChange={handleTaxChange}
                    className="h-8 w-full"
                  />
                </div>
              </div>
              <div>₹{calculateTaxAmount().toFixed(2)}</div>
            </div>
            <div className="flex justify-between py-1 font-bold">
              <div>Total</div>
              <div>₹{calculateTotal().toFixed(2)}</div>
            </div>
          </div>
          
          <div className="pt-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment Method
            </h3>
            {order.status !== "COMPLETED" && (
              <div className="flex gap-2">
                <Button 
                  variant={paymentMethod === "cash" ? "default" : "outline"}
                onClick={() => setPaymentMethod("cash")}
                className={`flex-1 ${activeKeyCommand === 'cash' ? 'ring-2 ring-primary animate-pulse' : ''}`}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Cash (C)
              </Button>
              <Button 
                variant={paymentMethod === "card" ? "default" : "outline"}
                onClick={() => setPaymentMethod("card")}
                className={`flex-1 ${activeKeyCommand === 'card' ? 'ring-2 ring-primary animate-pulse' : ''}`}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Card (D)
              </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Press <kbd className="px-1.5 py-0.5 text-xs rounded-md bg-muted border">C</kbd> for Cash or <kbd className="px-1.5 py-0.5 text-xs rounded-md bg-muted border">D</kbd> for Card
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/50">
        <Button 
          className={`w-full ${activeKeyCommand === 'complete' ? 'ring-2 ring-primary animate-pulse' : ''}`}
          size="lg"
          onClick={handleCompletePayment}
          disabled={processing}
          ref={completeButtonRef}
        >
          {processing ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4 animate-pulse" />
              Processing...
            </>
          ) : (
            <>
              <Receipt className="mr-2 h-4 w-4" />
              Complete Payment & Generate Receipt (Alt+P)
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 