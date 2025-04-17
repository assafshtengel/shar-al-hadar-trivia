
import React, { useState, useEffect } from 'react';

interface GameEndOverlayProps {
  isVisible: boolean;
  isHost: boolean;
}

const GameEndOverlay: React.FC<GameEndOverlayProps> = ({ isVisible, isHost }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  
  useEffect(() => {
    // Add a small delay before showing the overlay to prevent flashes when joining
    if (isVisible && !isHost) {
      const timer = setTimeout(() => {
        setShowOverlay(true);
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setShowOverlay(isVisible);
    }
  }, [isVisible, isHost]);
  
  if (!showOverlay || isHost) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md mx-auto animate-scale-in">
        <h2 className="text-2xl font-bold text-primary mb-4">המשחק הסתיים</h2>
        <p className="text-lg text-gray-700 mb-4">
          המשחק הסתיים. תחזרו לדף הבית להתחיל משחק חדש
        </p>
        <div className="text-sm text-gray-500">
          מועבר לדף הבית באופן אוטומטי...
        </div>
      </div>
    </div>
  );
};

export default GameEndOverlay;
