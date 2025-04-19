
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'טוען...' 
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-bold text-primary mb-2">{message}</h2>
        <p className="text-muted-foreground">אנא המתן</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
