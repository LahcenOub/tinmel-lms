import React, { createContext, useContext, useState, useEffect } from 'react';

interface LowDataModeContextType {
  isLowDataMode: boolean;
  toggleLowDataMode: () => void;
  connectionType: string | null;
}

const LowDataModeContext = createContext<LowDataModeContextType | undefined>(undefined);

export const LowDataModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLowDataMode, setIsLowDataMode] = useState(false);
  const [connectionType, setConnectionType] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Check for saved preference
      const savedMode = localStorage.getItem('tinmel_low_data_mode');
      if (savedMode !== null) {
        setIsLowDataMode(savedMode === 'true');
        return;
      }
    } catch (e) {
      console.warn("localStorage not available", e);
    }

    // Auto-detect slow connection
    // @ts-ignore - navigator.connection is experimental but widely supported in Chromium
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      setConnectionType(connection.effectiveType);
      
      // If 2g or slow-2g, enable low data mode by default
      if (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        setIsLowDataMode(true);
      }

      // Listen for changes
      const updateConnectionStatus = () => {
        setConnectionType(connection.effectiveType);
        try {
          if (connection.saveData && !localStorage.getItem('tinmel_low_data_mode')) {
             setIsLowDataMode(true);
          }
        } catch (e) {}
      };
      
      connection.addEventListener('change', updateConnectionStatus);
      return () => connection.removeEventListener('change', updateConnectionStatus);
    }
  }, []);

  const toggleLowDataMode = () => {
    const newMode = !isLowDataMode;
    setIsLowDataMode(newMode);
    try {
      localStorage.setItem('tinmel_low_data_mode', String(newMode));
    } catch (e) {}
  };

  const value = React.useMemo(() => ({ isLowDataMode, toggleLowDataMode, connectionType }), [isLowDataMode, connectionType]);

  return (
    <LowDataModeContext.Provider value={value}>
      {children}
    </LowDataModeContext.Provider>
  );
};

export const useLowDataMode = () => {
  const context = useContext(LowDataModeContext);
  if (context === undefined) {
    throw new Error('useLowDataMode must be used within a LowDataModeProvider');
  }
  return context;
};
