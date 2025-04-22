
import React from 'react';
import { Music, Music2, Music3, Music4, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MusicNoteProps {
  className?: string;
  type?: 'note1' | 'note2' | 'note3' | 'note4' | 'headphones';
  size?: number;
  color?: string;
  animation?: 'float' | 'float-alt' | 'none';
  isPlaying?: boolean;
}

const MusicNote: React.FC<MusicNoteProps> = ({ 
  className, 
  type = 'note1', 
  size = 24, 
  color = 'currentColor',
  animation = 'none',
  isPlaying = false
}) => {
  const animationClass = animation === 'float' 
    ? 'animate-float' 
    : animation === 'float-alt' 
      ? 'animate-float-alt' 
      : '';

  const icons = {
    note1: <Music size={size} color={color} />,
    note2: <Music2 size={size} color={color} />,
    note3: <Music3 size={size} color={color} />,
    note4: <Music4 size={size} color={color} />,
    headphones: <Headphones size={size} color={color} />
  };

  return (
    <div className={cn(animationClass, isPlaying ? 'animate-pulse' : '', className)}>
      {icons[type]}
    </div>
  );
};

export default MusicNote;
