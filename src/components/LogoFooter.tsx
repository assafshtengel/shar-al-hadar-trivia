
import React from 'react';
import { Music, Gamepad } from 'lucide-react';

const LogoFooter = () => {
  return (
    <div className="w-full flex flex-col items-center mt-12 mb-6">
      {/* Logo Container */}
      <div className="flex items-center gap-2 mb-2">
        <Music className="w-5 h-5 text-primary animate-float" />
        <span className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
          Shtengel Games
        </span>
        <Gamepad className="w-5 h-5 text-secondary animate-float-alt" />
      </div>
      
      {/* Hebrew Caption */}
      <p className="text-sm text-muted-foreground mt-1">
        Powered by Shtengel Games
      </p>
    </div>
  );
};

export default LogoFooter;
