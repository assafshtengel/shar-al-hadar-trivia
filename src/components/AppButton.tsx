
import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger';
type ButtonSize = 'xs' | 'sm' | 'default' | 'lg';

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
}

const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(({
  className,
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  loading = false,
  ...props
}, ref) => {
  const isDisabled = disabled || loading;
  
  const variants = {
    primary: 'bg-primary hover:bg-primary/90 active:bg-primary-active text-white focus:outline-none focus:ring-2 focus:ring-primary/50',
    secondary: 'bg-secondary hover:bg-secondary/90 active:bg-secondary-active text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50',
    outline: 'border border-primary hover:bg-primary/10 text-primary active:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline',
    danger: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50'
  };
  
  const sizes = {
    xs: 'text-xs px-2.5 py-1 rounded',
    sm: 'text-sm px-3 py-1.5 rounded',
    default: 'px-4 py-2 rounded-md',
    lg: 'text-lg px-5 py-2.5 rounded-lg'
  };
  
  return <button 
    className={cn(
      'relative inline-flex items-center justify-center font-medium transition-all duration-200 shadow-sm', 
      variants[variant], 
      sizes[size], 
      fullWidth ? 'w-full' : '', 
      isDisabled && 'opacity-50 cursor-not-allowed hover:bg-opacity-100', 
      className
    )} 
    disabled={isDisabled} 
    ref={ref} 
    {...props}
  >
    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
    <span className={cn("my-0 mx-0 text-center", {
      'text-lg': size === 'lg',
      'text-sm': size === 'sm',
      'text-xs': size === 'xs',
    })}>{children}</span>
    {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
  </button>;
});

AppButton.displayName = 'AppButton';

export default AppButton;
