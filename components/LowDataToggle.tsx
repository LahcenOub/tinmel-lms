import React from 'react';
import { useLowDataMode } from '../contexts/LowDataModeContext';
import { Zap, ZapOff } from 'lucide-react';

const LowDataToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isLowDataMode, toggleLowDataMode } = useLowDataMode();

  return (
    <button
      onClick={toggleLowDataMode}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        isLowDataMode 
          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
          : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/10'
      } ${className}`}
      title={isLowDataMode ? "Mode économie de données activé" : "Activer le mode économie de données"}
    >
      {isLowDataMode ? <ZapOff className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
      <span>{isLowDataMode ? 'Mode Éco' : 'Mode Standard'}</span>
    </button>
  );
};

export default LowDataToggle;
