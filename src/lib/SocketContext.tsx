import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import socket from '../utils/sockets';
import { toast } from 'sonner';


// Define types for the context
type SocketContextType = {
  socket: typeof socket;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  
  useEffect(() => {
    const onConnect = () => {
      console.log('Socket connected successfully');
      setIsConnected(true);
      toast.success('Real-time connection established', {
        id: 'socket-connection',
        duration: 2000
      });
    };
    
    const onDisconnect = () => {
      console.log('Socket disconnected');
      setIsConnected(false);
      toast.error('Real-time connection lost. Reconnecting...', {
        id: 'socket-disconnection',
        duration: 3000
      });
    };

    const onReconnect = () => {
      console.log('Socket reconnecting');
      toast.loading('Reconnecting to server...', {
        id: 'socket-reconnection'
      });
    };

    const onReconnectAttempt = (attemptNumber: number) => {
      console.log(`Socket reconnection attempt: ${attemptNumber}`);
    };

    const onReconnectError = (error: Error) => {
      console.error('Socket reconnection error:', error);
      toast.error('Failed to reconnect. Please refresh the page.', {
        id: 'socket-reconnection-error'
      });
    };

    const onReconnectSuccess = () => {
      console.log('Socket reconnected successfully');
      toast.success('Reconnected successfully', {
        id: 'socket-reconnection'
      });
    };
    
    // Register connection events
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect', onReconnectSuccess);
    socket.io.on('reconnect_attempt', (attemptNumber) => {
      onReconnectAttempt(attemptNumber);
      onReconnect(); // Call both handlers on the same event
    });
    socket.io.on('reconnect_error', onReconnectError);
    
    // Register server welcome message
    socket.on('welcome', (message: string) => {
      console.log('[Socket] Server message:', message);
    });
    
    // Order status events - log all events at the provider level for debugging
    socket.on('order:status-change', (order: any) => {
      console.log('[Socket] Order status changed:', order);
    });
    
    socket.on('order:status-preparing', (order: any) => {
      console.log('[Socket] Order is being prepared:', order);
    });
    
    socket.on('order:payment-processing', (orderData: any) => {
      console.log('[Socket] Order payment is being processed:', orderData);
    });

    socket.on('order:new-order', (order: any) => {
      console.log('[Socket] New order received:', order);
    });

    // Error handling
    socket.on('connect_error', (error: Error) => {
      console.error('[Socket] Connection error:', error);
      toast.error('Connection error. Please check your network.', {
        id: 'socket-connection-error'
      });
    });

    // Clean up event listeners on unmount
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect', onReconnectSuccess);
      socket.io.off('reconnect_attempt');  // Remove all handlers for this event
      socket.io.off('reconnect_error', onReconnectError);
      socket.off('welcome');
      socket.off('order:status-change');
      socket.off('order:status-preparing');
      socket.off('order:payment-processing');
      socket.off('order:new-order');
      socket.off('connect_error');
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};