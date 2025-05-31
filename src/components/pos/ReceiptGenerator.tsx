import { useEffect, useRef } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Printer, RotateCcw } from "lucide-react";
import { WaiterOrder } from "../../lib/api/orders";
import { format } from "date-fns";

interface ReceiptGeneratorProps {
  order: WaiterOrder;
  onPrint: () => void;
  onNewTransaction: () => void;
}

export function ReceiptGenerator({
  order,
  onPrint,
  onNewTransaction,
}: ReceiptGeneratorProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Print with Alt+P
      if (e.altKey && (e.key === "p" || e.key === "P")) {
        printThermalReceipt();
      }

      // New transaction with Alt+N
      if (e.altKey && (e.key === "n" || e.key === "N")) {
        onNewTransaction();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onPrint, onNewTransaction]);

  // Calculate subtotal
  const calculateSubtotal = () => {
    return order.orderItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
  };

  // Get tax amount
  const getTaxAmount = () => {
    const subtotal = calculateSubtotal();
    const total = Number(order.total);
    
    // If we have payment details with tax information
    if (order.paymentDetails?.taxAmount) {
      return Number(order.paymentDetails.taxAmount);
    }
    
    // If total > subtotal, assume difference is tax
    if (total > subtotal) {
      return total - subtotal;
    }
    
    // Default to 0 if no tax info
    return 0;
  };

  // Get tax percentage
  const getTaxPercentage = () => {
    // If we have payment details with tax percentage
    if (order.paymentDetails?.taxPercentage) {
      return Number(order.paymentDetails.taxPercentage);
    }
    
    // Try to calculate it from amounts
    const taxAmount = getTaxAmount();
    const subtotal = calculateSubtotal();
    
    if (subtotal > 0 && taxAmount > 0) {
      return Math.round((taxAmount / subtotal) * 100 * 10) / 10; // Round to 1 decimal place
    }
    
    // Default
    return 0;
  };

  // Specialized function for thermal receipt printing
  const printThermalReceipt = () => {
    if (!receiptRef.current) return;

    // Create a new window for printing
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Please allow popups to print receipts");
      return;
    }

    // Prepare receipt content
    const items = order.orderItems
      .map(
        (item) => `
      <tr>
        <td>${item.item?.name}</td>
        <td>${item.quantity}</td>
        <td>₹${Number(item.price).toFixed(2)}</td>
        <td>₹${(Number(item.price) * item.quantity).toFixed(2)}</td>
      </tr>
    `
      )
      .join("");

    const subtotal = calculateSubtotal();
    const taxAmount = getTaxAmount();
    const taxPercentage = getTaxPercentage();

    // Write the print document
    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt #${order.id}</title>
          <style>
            @page {
              margin: 0;
              size: 80mm auto;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              font-family: 'Courier New', monospace;
              font-size: 10px;
              width: 80mm;
              background-color: white;
              color: black;
              margin: 0;
              padding: 0;
            }
            .receipt-container {
              padding: 4mm;
              width: 80mm;
            }
            .receipt-header {
              text-align: center;
              margin-bottom: 5mm;
            }
            .receipt-header h1 {
              font-size: 14px;
              margin: 0;
              padding: 0;
              font-weight: bold;
            }
            .receipt-header p {
              font-size: 10px;
              margin: 1mm 0;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 2mm 0;
              width: 100%;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              text-align: left;
              padding: 1mm 0;
              font-size: 10px;
            }
            th:nth-child(2), td:nth-child(2) {
              text-align: center;
              width: 8mm;
            }
            th:nth-child(3), td:nth-child(3),
            th:nth-child(4), td:nth-child(4) {
              text-align: right;
              width: 14mm;
            }
            .totals {
              text-align: right;
              margin: 2mm 0;
            }
            .total-line {
              display: flex;
              justify-content: space-between;
            }
            .total-line.bold {
              font-weight: bold;
            }
            .thank-you {
              text-align: center;
              margin-top: 5mm;
            }
            @media print {
              html, body {
                width: 80mm;
                height: auto;
                margin: 0;
                padding: 0;
              }
              .receipt-container {
                width: 80mm;
                margin: 0;
                padding: 4mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">
              <h1>Hotel Dastan</h1>
              <p>DC Complex,4th Floor, Royal City, Chahal Road, Faridkot, Punjab</p>
              <p>Mobile- 9876543210</p>
              <p>GSTIN- 03ANPPC7864G1ZV</p>
              <p>Receipt</p>
              <p>${format(new Date(order.updatedAt), "dd/MM/yyyy HH:mm:ss")}</p>
              <p>Order: #${order.id} • Table: ${
      order.table?.tableNumber || "Unknown"
    }</p>
            </div>
            
            <div class="divider"></div>
            
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${items}
              </tbody>
            </table>
            
            <div class="divider"></div>
            
            <div class="totals">
              <div class="total-line">
                <span>Subtotal:</span>
                <span>₹${subtotal.toFixed(2)}</span>
              </div>
              ${
                taxAmount > 0
                  ? `<div class="total-line">
                      <span>Tax (${taxPercentage}%):</span>
                      <span>₹${taxAmount.toFixed(2)}</span>
                    </div>`
                  : ""
              }
              <div class="total-line bold">
                <span>Total:</span>
                <span>₹${Number(order.total).toFixed(2)}</span>
              </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="thank-you">
              <p>Thank you for your visit!</p>
              <p>Please come again.</p>
              <p>* * * * * * * * * * * * * * * * * * *</p>
            </div>
          </div>
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const subtotal = calculateSubtotal();
  const taxAmount = getTaxAmount();
  const taxPercentage = getTaxPercentage();

  return (
    <div className="space-y-4">
      <Card className="print:shadow-none print:border-none receipt-content">
        <CardContent className="p-8 thermal-receipt" ref={receiptRef}>
          {/* Receipt Header */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold">Hotel Dastan</h2>
            <p>DC Complex,4th Floor, Royal City, Chahal Road, Faridkot, Punjab</p>
            <p>Mobile- 9876543210</p>
            <p>GSTIN- 03ANPPC7864G1ZV</p>
            <p className="text-xs text-muted-foreground">Receipt</p>
            <div className="text-xs mt-1">
              <p>{format(new Date(order.updatedAt), "dd/MM/yyyy HH:mm:ss")}</p>
              <p>
                Order: #{order.id} • Table:{" "}
                {order.table?.tableNumber || "Unknown"}
              </p>
            </div>
          </div>

          {/* Line separator */}
          <div className="border-t border-dashed my-2"></div>

          {/* Order Items */}
          <div className="my-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left">Item</th>
                  <th className="text-center w-8">Qty</th>
                  <th className="text-right w-16">Price</th>
                  <th className="text-right w-16">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.orderItems.map((item) => (
                  <tr key={item.id} className="border-b border-dotted">
                    <td className="py-1 text-left">{item.item?.name}</td>
                    <td className="py-1 text-center">{item.quantity}</td>
                    <td className="py-1 text-right">
                      ₹{Number(item.price).toFixed(2)}
                    </td>
                    <td className="py-1 text-right">
                      ₹{(Number(item.price) * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Line separator */}
          <div className="border-t border-dashed my-2"></div>

          {/* Totals */}
          <div className="text-right text-xs">
            <div className="flex justify-between py-1">
              <div>Subtotal:</div>
              <div>₹{subtotal.toFixed(2)}</div>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between py-1">
                <div>Tax ({taxPercentage}%):</div>
                <div>₹{taxAmount.toFixed(2)}</div>
              </div>
            )}
            <div className="flex justify-between py-1 font-bold">
              <div>Total:</div>
              <div>₹{Number(order.total).toFixed(2)}</div>
            </div>
          </div>

          {/* Line separator */}
          <div className="border-t border-dashed my-2"></div>

          {/* Thank you note */}
          <div className="mt-4 text-center text-xs">
            <p>Thank you for your visit!</p>
            <p>Please come again.</p>
            <p className="mt-2">* * * * * * * * * * * * * * * * * * *</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 print:hidden">
        <Button variant="outline" className="flex-1" onClick={onNewTransaction}>
          <RotateCcw className="mr-2 h-4 w-4" />
          New Transaction (Alt+N)
        </Button>
        <Button className="flex-1" onClick={printThermalReceipt}>
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt (Alt+P)
        </Button>
      </div>
    </div>
  );
}
