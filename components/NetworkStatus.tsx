import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Radio } from 'lucide-react';
import { useNetworkMode } from '../contexts/NetworkModeContext';

const NetworkStatus: React.FC = () => {
  const { mode, setMode } = useNetworkMode();
  const [showBanner, setShowBanner] = useState(false);
  const [lastMode, setLastMode] = useState(mode);

  useEffect(() => {
    if (mode !== lastMode) {
      setShowBanner(true);
      setLastMode(mode);
      if (mode === 'ONLINE') {
        const timer = setTimeout(() => setShowBanner(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [mode, lastMode]);

  // If explicit offline/online is triggered from browser
  useEffect(() => {
    const handleOnline = () => {
      // Handled by Context, just trigger banner
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner && mode === 'ONLINE') return null;

  return (
    <div 
      className={`fixed bottom-4 left-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-all duration-300 transform ${
        mode === 'ONLINE' 
          ? 'bg-green-600 text-white translate-y-0' 
          : mode === 'LORAWAN'
          ? 'bg-purple-600 text-white translate-y-0 shadow-purple-500/50'
          : 'bg-amber-600 text-white translate-y-0'
      }`}
    >
      {mode === 'ONLINE' ? <Wifi className="w-5 h-5" /> : mode === 'LORAWAN' ? <Radio className="w-5 h-5 animate-pulse" /> : <WifiOff className="w-5 h-5" />}
      <div className="flex-1">
        <p className="font-bold text-sm">
          {mode === 'ONLINE' ? 'Connexion rétablie' : mode === 'LORAWAN' ? 'Mode LoRaWAN Actif' : 'Mode hors ligne'}
        </p>
        <p className="text-xs opacity-90">
          {mode === 'ONLINE' ? 'Synchronisation en cours...' : mode === 'LORAWAN' ? 'Émission bas-débit activée.' : 'Données stockées localement.'}
        </p>
      </div>
      
      {/* Dev toggle since we lack physical antannas */}
      {mode !== 'ONLINE' && (
        <button 
          onClick={() => setMode(mode === 'LORAWAN' ? 'OFFLINE' : 'LORAWAN')}
          className="ml-2 px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition"
        >
          Basculer {mode === 'LORAWAN' ? 'Offline' : 'LoRa'}
        </button>
      )}
    </div>
  );
};

export default NetworkStatus;
