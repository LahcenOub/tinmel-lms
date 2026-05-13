import React, { createContext, useContext, useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

export type ConnectivityMode = 'ONLINE' | 'OFFLINE' | 'LORAWAN';

export interface QueuedPayload {
  id: string;
  type: 'MESSAGE' | 'QUIZ_SUBMISSION' | 'SOS' | 'BROADCAST';
  data: any;
  status: 'PENDING' | 'TRANSMITTING' | 'SENT' | 'FAILED';
  timestamp: string;
}

interface NetworkModeContextType {
  mode: ConnectivityMode;
  setMode: (mode: ConnectivityMode) => void;
  // LoRa Queue Management
  loraQueue: QueuedPayload[];
  addToLoraQueue: (type: QueuedPayload['type'], data: any) => void;
  clearLoraQueue: () => void;
  // Gamification (Eco-Points)
  ecoPoints: number;
}

const NetworkModeContext = createContext<NetworkModeContextType | undefined>(undefined);

export const NetworkModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ConnectivityMode>(navigator.onLine ? 'ONLINE' : 'OFFLINE');
  const [loraQueue, setLoraQueue] = useState<QueuedPayload[]>([]);
  const [ecoPoints, setEcoPoints] = useState<number>(0);

  // Listen for browser online/offline events to switch mode automatically if not explicitly overriden
  // Or handle manually via settings
  useEffect(() => {
    const handleOnline = () => {
      // If we were merely offline, go back online. If we were explicitly in LORAWAN, we could stay LORAWAN, but for simplicity:
      setMode((prev) => (prev === 'LORAWAN' ? 'LORAWAN' : 'ONLINE'));
    };

    const handleOffline = () => {
      setMode((prev) => (prev === 'LORAWAN' ? 'LORAWAN' : 'OFFLINE'));
    };

    globalThis.addEventListener('online', handleOnline);
    globalThis.addEventListener('offline', handleOffline);

    // Initial check for eco-points
    try {
      const storedPoints = localStorage.getItem('ecoPoints');
      if (storedPoints) setEcoPoints(Number.parseInt(storedPoints, 10));
    } catch {}

    return () => {
      globalThis.removeEventListener('online', handleOnline);
      globalThis.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Mock transmission interval for LoRa
  useEffect(() => {
    if (mode === 'LORAWAN' && loraQueue.some(q => q.status === 'PENDING')) {
      const timer = setInterval(() => {
        setLoraQueue(prev => {
          const nextPending = prev.find(p => p.status === 'PENDING');
          if (!nextPending) return prev;

          // On successful transmission via LoRa, award "Eco-Points"
          setEcoPoints(current => {
             const updated = current + 10;
             try { localStorage.setItem(DOMPurify.sanitize('ecoPoints'), DOMPurify.sanitize(updated.toString())); } catch {}
             return updated;
          });

          // Simulate processing
          return prev.map(item =>
            item.id === nextPending.id ? { ...item, status: 'SENT' as const } : item
          );
        });
      }, 5000); // Process one message every 5 seconds locally

      return () => clearInterval(timer);
    }
  }, [mode, loraQueue]);

  const addToLoraQueue = React.useCallback((type: QueuedPayload['type'], data: any) => {
    const newItem: QueuedPayload = {
      id: Date.now().toString(),
      type,
      data,
      status: 'PENDING',
      timestamp: new Date().toISOString(),
    };
    setLoraQueue(prev => [...prev, newItem]);
  }, []);

  const clearLoraQueue = React.useCallback(() => {
    setLoraQueue(prev => prev.filter(item => item.status === 'PENDING' || item.status === 'TRANSMITTING'));
  }, []);

  const value = React.useMemo(() => ({ mode, setMode, loraQueue, addToLoraQueue, clearLoraQueue, ecoPoints }), [mode, loraQueue, addToLoraQueue, clearLoraQueue, ecoPoints]);

  return (
    <NetworkModeContext.Provider value={value}>
      {children}
    </NetworkModeContext.Provider>
  );
};

export const useNetworkMode = () => {
  const context = useContext(NetworkModeContext);
  if (context === undefined) {
    throw new Error('useNetworkMode must be used within a NetworkModeProvider');
  }
  return context;
};
