import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000); // Hide "Back Online" after 3s
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner && isOnline) return null;

  return (
    <div 
      className={`fixed bottom-4 left-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-all duration-300 transform ${
        isOnline 
          ? 'bg-green-600 text-white translate-y-0' 
          : 'bg-amber-600 text-white translate-y-0'
      }`}
    >
      {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
      <div>
        <p className="font-bold text-sm">
          {isOnline ? 'Connexion rétablie' : 'Mode hors ligne'}
        </p>
        {!isOnline && (
          <p className="text-xs opacity-90">
            Vous pouvez continuer à travailler.
          </p>
        )}
      </div>
    </div>
  );
};

export default NetworkStatus;
