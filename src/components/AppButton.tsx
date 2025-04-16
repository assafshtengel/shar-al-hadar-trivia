
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'default' | 'lg';
  children: React.ReactNode;
  className?: string;
}

const AppButton: React.FC<AppButtonProps> = ({ 
  variant = 'primary', 
  size = 'default', 
  children, 
  className,
  ...props 
}) => {
  return (
    <Button
      className={cn(
        "font-bold transition-all w-full", 
        variant === 'primary' 
          ? "bg-primary hover:bg-primary/90 text-white" 
          : "bg-secondary hover:bg-secondary/90 text-primary",
        size === 'lg' && "text-lg py-6",
        "shadow-md hover:shadow-lg hover:-translate-y-1",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};

export default AppButton;
