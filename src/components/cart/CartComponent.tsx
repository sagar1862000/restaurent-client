import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CartItem, Cart, cartApi } from "../../lib/api/cart";
import {
  Plus,
  Minus,
  Trash2,
  X,
  ShoppingCart,
  CheckCircle,
  Pizza,
  Loader
} from "lucide-react";

interface CartComponentProps {
  tableId: number;
  isOpen: boolean;
  onClose: () => void;
  onCartUpdate: (cartItemCount: number) => void;
}

const CartComponent: React.FC<CartComponentProps> = ({
  tableId,
  isOpen,
  onClose,
  onCartUpdate
}) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [placingOrder, setPlacingOrder] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cart when component mounts and whenever it opens
  useEffect(() => {
    if (isOpen) {
      fetchCart();
    }
  }, [isOpen, tableId]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const cartData = await cartApi.getCartByTableId(tableId);
      setCart(cartData);
      onCartUpdate(cartData.items.length);
    } catch (err) {
      console.error("Error fetching cart:", err);
      setError("Failed to load cart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateItemQuantity = async (cartItemId: number, quantity: number) => {
    if (quantity < 1) return;
    
    try {
      setUpdating(true);
      await cartApi.updateCartItem(cartItemId, quantity);
      await fetchCart();
    } catch (err) {
      console.error("Error updating item quantity:", err);
      setError("Failed to update quantity. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const removeItem = async (cartItemId: number) => {
    try {
      setUpdating(true);
      await cartApi.removeFromCart(cartItemId);
      await fetchCart();
    } catch (err) {
      console.error("Error removing item:", err);
      setError("Failed to remove item. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const placeOrder = async () => {
    try {
      setPlacingOrder(true);
      setError(null);
      await cartApi.placeOrder(tableId);
      setOrderSuccess(true);
      await fetchCart(); // Refresh cart after placing order (should be empty)
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setOrderSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Error placing order:", err);
      setError("Failed to place order. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  // Get the price for an item, handling fullPrice and halfPrice
  const getItemPrice = (item: any, isHalfPortion: boolean = false): number => {
    if (isHalfPortion && item.halfPrice) {
      return item.halfPrice;
    }
    return item.fullPrice || 0;
  };

  // Empty cart view
  const EmptyCartView = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <ShoppingCart className="h-16 w-16 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-300 mb-1">Your cart is empty</h3>
      <p className="text-sm text-gray-500 max-w-xs text-center">
        Add some delicious items from the menu to place an order.
      </p>
    </div>
  );

  // Success view
  const OrderSuccessView = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12"
    >
      <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-300 mb-1">Order Placed Successfully!</h3>
      <p className="text-sm text-gray-500 max-w-xs text-center">
        Your order has been received and is being prepared.
      </p>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-70 z-50 overflow-hidden flex justify-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="bg-zinc-900 w-full max-w-md h-full overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-zinc-900 z-10 border-b border-zinc-800 px-4 py-4 flex justify-between items-center">
              <div className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                <h2 className="text-xl font-bold">Your Order</h2>
              </div>
              <button
                className="p-2 rounded-full hover:bg-zinc-800"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Content */}
            <div className="px-4 py-4">
              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <Loader className="h-8 w-8 animate-spin text-gray-500" />
                </div>
              ) : error ? (
                <div className="text-red-500 p-4 text-center">{error}</div>
              ) : orderSuccess ? (
                <OrderSuccessView />
              ) : cart && cart.items.length === 0 ? (
                <EmptyCartView />
              ) : (
                <>
                  {/* Cart Items */}
                  <ul className="divide-y divide-zinc-800">
                    {cart?.items.map((item) => (
                      <li key={item.id} className="py-4 flex">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-zinc-800 bg-zinc-800 mr-4">
                          {item.item.imageUrl ? (
                            <img
                              src={item.item.imageUrl}
                              alt={item.item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-500">
                              <Pizza className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div className="flex justify-between text-base font-medium">
                            <div>
                              <h3 className="text-white">{item.item.name}</h3>
                              {item.isHalfPortion && (
                                <span className="text-xs text-amber-400">Half Portion</span>
                              )}
                              {item.item.tags && item.item.tags.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {item.item.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-700 text-gray-300">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="ml-4 text-white">
                              {formatPrice(getItemPrice(item.item, item.isHalfPortion) * item.quantity)}
                            </p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                            {formatPrice(getItemPrice(item.item, item.isHalfPortion))} each
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex border border-zinc-700 rounded">
                              <button
                                className="px-3 py-1 text-gray-400 hover:text-white disabled:opacity-50"
                                onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                disabled={updating || item.quantity <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="flex items-center justify-center min-w-8 px-2 text-white">
                                {item.quantity}
                              </span>
                              <button
                                className="px-3 py-1 text-gray-400 hover:text-white disabled:opacity-50"
                                onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                disabled={updating}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            <button
                              className="text-red-500 hover:text-red-400 p-1 disabled:opacity-50"
                              onClick={() => removeItem(item.id)}
                              disabled={updating}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Cart Summary */}
                  <div className="border-t border-zinc-800 pt-4 mt-4">
                    <div className="flex justify-between text-base font-medium text-white mb-4">
                      <p>Subtotal</p>
                      <p>{formatPrice(cart?.total || 0)}</p>
                    </div>
                    <button
                      onClick={placeOrder}
                      disabled={placingOrder || cart?.items.length === 0}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-medium hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {placingOrder ? (
                        <span className="flex items-center justify-center">
                          <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                          Processing...
                        </span>
                      ) : (
                        "Place Order"
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CartComponent; 