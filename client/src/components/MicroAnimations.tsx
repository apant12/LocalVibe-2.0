import React, { useState, useEffect } from 'react';

// Floating Action Button with ripple effect
export const AnimatedButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}> = ({ children, onClick, className = '', variant = 'primary', size = 'md' }) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [isPressed, setIsPressed] = useState(false);

  const variants = {
    primary: 'bg-primary hover:bg-primary/90 text-black',
    secondary: 'bg-surface hover:bg-surface/90 text-white border border-gray-600',
    ghost: 'hover:bg-white/10 text-white'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = {
      id: Date.now(),
      x,
      y
    };

    setRipples(prev => [...prev, newRipple]);
    setIsPressed(true);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);

    setTimeout(() => setIsPressed(false), 150);

    onClick?.();
  };

  return (
    <button
      className={`
        relative overflow-hidden rounded-lg font-semibold transition-all duration-200 
        transform active:scale-95 hover:scale-105 hover:shadow-lg
        ${variants[variant]} ${sizes[size]} ${className}
        ${isPressed ? 'scale-95' : ''}
      `}
      onClick={handleClick}
    >
      {children}
      
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/20 animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: '20px',
            height: '20px',
            animationDuration: '600ms'
          }}
        />
      ))}
      
      {/* Shine effect */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent hover:translate-x-full transition-transform duration-1000 ease-in-out" />
    </button>
  );
};

// Staggered list animations
export const StaggeredList: React.FC<{
  children: React.ReactNode[];
  className?: string;
  delay?: number;
}> = ({ children, className = '', delay = 100 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={`
            transition-all duration-500 ease-out
            ${isVisible 
              ? 'translate-y-0 opacity-100' 
              : 'translate-y-4 opacity-0'
            }
          `}
          style={{
            transitionDelay: `${index * delay}ms`
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

// Loading skeleton with shimmer
export const LoadingSkeleton: React.FC<{
  className?: string;
  lines?: number;
}> = ({ className = '', lines = 3 }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="bg-gray-700 rounded animate-pulse relative overflow-hidden"
          style={{ height: '20px', width: `${Math.random() * 40 + 60}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
        </div>
      ))}
    </div>
  );
};

// Floating notification toast
export const FloatingToast: React.FC<{
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
}> = ({ message, type, isVisible, onClose }) => {
  const typeStyles = {
    success: 'bg-green-600 border-green-500',
    error: 'bg-red-600 border-red-500',
    info: 'bg-blue-600 border-blue-500'
  };

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 transform transition-all duration-300 ease-out
        ${isVisible 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
      `}
    >
      <div className={`
        ${typeStyles[type]} text-white px-4 py-3 rounded-lg border shadow-lg
        backdrop-blur-sm flex items-center space-x-2 min-w-64
      `}>
        <span>{message}</span>
        <button 
          onClick={onClose}
          className="ml-auto text-white/80 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Smooth counter animation
export const AnimatedCounter: React.FC<{
  value: number;
  duration?: number;
  className?: string;
}> = ({ value, duration = 1000, className = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      setDisplayValue(Math.floor(value * easeOutQuart));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return (
    <span className={`font-mono ${className}`}>
      {displayValue.toLocaleString()}
    </span>
  );
};

// Breathing/pulse animation for active elements
export const PulseAnimation: React.FC<{
  children: React.ReactNode;
  isActive?: boolean;
  className?: string;
}> = ({ children, isActive = false, className = '' }) => {
  return (
    <div className={`
      ${isActive ? 'animate-pulse' : ''}
      ${className}
    `}>
      {children}
      {isActive && (
        <div className="absolute inset-0 rounded-lg bg-primary/10 animate-ping" />
      )}
    </div>
  );
};

// Parallax scroll effect
export const ParallaxContainer: React.FC<{
  children: React.ReactNode;
  speed?: number;
  className?: string;
}> = ({ children, speed = 0.5, className = '' }) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.pageYOffset);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`transition-transform duration-100 ease-out ${className}`}
      style={{
        transform: `translateY(${offset * speed}px)`
      }}
    >
      {children}
    </div>
  );
};

// Morphing icon animation
export const MorphingIcon: React.FC<{
  icon1: React.ReactNode;
  icon2: React.ReactNode;
  isSecond?: boolean;
  className?: string;
}> = ({ icon1, icon2, isSecond = false, className = '' }) => {
  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`
          transition-all duration-300 ease-in-out absolute inset-0
          ${isSecond ? 'opacity-0 scale-75 rotate-90' : 'opacity-100 scale-100 rotate-0'}
        `}
      >
        {icon1}
      </div>
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${isSecond ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 -rotate-90'}
        `}
      >
        {icon2}
      </div>
    </div>
  );
};

// Elastic search input
export const ElasticInput: React.FC<{
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onChange?: (value: string) => void;
  className?: string;
}> = ({ placeholder, onFocus, onBlur, onChange, className = '' }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState('');

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onChange?.(e.target.value);
        }}
        onFocus={() => {
          setIsFocused(true);
          onFocus?.();
        }}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        placeholder={placeholder}
        className={`
          w-full bg-black/40 border border-gray-600 rounded-lg px-4 py-2 text-white
          placeholder-gray-400 transition-all duration-300 ease-out
          ${isFocused 
            ? 'transform scale-105 shadow-lg border-primary/50 bg-black/60' 
            : 'hover:border-gray-500'
          }
        `}
      />
      
      {/* Animated border glow */}
      {isFocused && (
        <div className="absolute inset-0 rounded-lg bg-primary/20 -z-10 animate-pulse" />
      )}
    </div>
  );
};