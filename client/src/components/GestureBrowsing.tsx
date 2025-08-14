import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hand, Zap, RotateCcw } from "lucide-react";

interface GestureBrowsingProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  children: React.ReactNode;
  enabled?: boolean;
}

interface TouchData {
  startX: number;
  startY: number;
  startTime: number;
  currentX: number;
  currentY: number;
}

export default function GestureBrowsing({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onLongPress,
  onDoubleTap,
  children,
  enabled = true
}: GestureBrowsingProps) {
  const [touchData, setTouchData] = useState<TouchData | null>(null);
  const [gestureActive, setGestureActive] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [currentGesture, setCurrentGesture] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const SWIPE_THRESHOLD = 50;
  const LONG_PRESS_DURATION = 500;
  const DOUBLE_TAP_DELAY = 300;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    
    const touch = e.touches[0];
    const now = Date.now();
    
    setTouchData({
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: now,
      currentX: touch.clientX,
      currentY: touch.clientY
    });
    
    setGestureActive(true);

    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      if (onLongPress) {
        setCurrentGesture('Long Press');
        onLongPress();
        navigator.vibrate?.(50);
      }
    }, LONG_PRESS_DURATION);

    // Handle double tap detection
    if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY) {
      if (onDoubleTap) {
        setCurrentGesture('Double Tap');
        onDoubleTap();
        navigator.vibrate?.(25);
      }
      setLastTap(0);
    } else {
      setLastTap(now);
    }
  }, [enabled, lastTap, onLongPress, onDoubleTap]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !touchData) return;
    
    const touch = e.touches[0];
    setTouchData(prev => prev ? {
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY
    } : null);

    // Clear long press if user moves too much
    const deltaX = Math.abs(touch.clientX - touchData.startX);
    const deltaY = Math.abs(touch.clientY - touchData.startY);
    
    if ((deltaX > 10 || deltaY > 10) && longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Show gesture preview
    if (deltaX > 20 || deltaY > 20) {
      if (deltaX > deltaY) {
        setCurrentGesture(deltaX > 0 ? 'Swipe Right' : 'Swipe Left');
      } else {
        setCurrentGesture(deltaY < 0 ? 'Swipe Up' : 'Swipe Down');
      }
    }
  }, [enabled, touchData]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || !touchData) return;
    
    const deltaX = touchData.currentX - touchData.startX;
    const deltaY = touchData.currentY - touchData.startY;
    const duration = Date.now() - touchData.startTime;
    
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // Detect swipe gestures
    const isSwipeX = Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY);
    const isSwipeY = Math.abs(deltaY) > SWIPE_THRESHOLD && Math.abs(deltaY) > Math.abs(deltaX);
    
    if (isSwipeX) {
      if (deltaX > 0 && onSwipeRight) {
        setCurrentGesture('Swipe Right ✓');
        onSwipeRight();
        navigator.vibrate?.(30);
      } else if (deltaX < 0 && onSwipeLeft) {
        setCurrentGesture('Swipe Left ✓');
        onSwipeLeft();
        navigator.vibrate?.(30);
      }
    } else if (isSwipeY) {
      if (deltaY < 0 && onSwipeUp) {
        setCurrentGesture('Swipe Up ✓');
        onSwipeUp();
        navigator.vibrate?.(30);
      } else if (deltaY > 0 && onSwipeDown) {
        setCurrentGesture('Swipe Down ✓');
        onSwipeDown();
        navigator.vibrate?.(30);
      }
    }
    
    // Reset state
    setTouchData(null);
    setGestureActive(false);
    
    // Clear gesture indicator after delay
    setTimeout(() => {
      setCurrentGesture(null);
    }, 1000);
  }, [enabled, touchData, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const getGestureAnimation = () => {
    if (!gestureActive || !touchData) return {};
    
    const deltaX = touchData.currentX - touchData.startX;
    const deltaY = touchData.currentY - touchData.startY;
    
    return {
      transform: `translate(${deltaX * 0.1}px, ${deltaY * 0.1}px)`,
      transition: gestureActive ? 'none' : 'transform 0.3s ease-out'
    };
  };

  return (
    <div 
      ref={containerRef}
      className="relative touch-none select-none"
      style={getGestureAnimation()}
    >
      {children}
      
      {/* Gesture Feedback Overlay */}
      {currentGesture && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4">
          <Card className="bg-black/90 border-primary/50 backdrop-blur-sm">
            <div className="px-4 py-2 flex items-center space-x-2">
              <div className="text-primary">
                {currentGesture.includes('Swipe Left') && '👈'}
                {currentGesture.includes('Swipe Right') && '👉'}
                {currentGesture.includes('Swipe Up') && '👆'}
                {currentGesture.includes('Swipe Down') && '👇'}
                {currentGesture.includes('Long Press') && '✋'}
                {currentGesture.includes('Double Tap') && '👆👆'}
              </div>
              <span className="text-white text-sm font-medium">
                {currentGesture}
              </span>
              {currentGesture.includes('✓') && (
                <Zap className="w-4 h-4 text-green-500" />
              )}
            </div>
          </Card>
        </div>
      )}
      
      {/* Gesture Guide (shown when not active) */}
      {enabled && !gestureActive && (
        <div className="absolute bottom-4 right-4 opacity-30 hover:opacity-80 transition-opacity">
          <Badge variant="secondary" className="bg-black/60 text-gray-300 text-xs">
            <Hand className="w-3 h-3 mr-1" />
            Gesture enabled
          </Badge>
        </div>
      )}
      
      {/* Touch ripple effect */}
      {gestureActive && touchData && (
        <div 
          className="fixed pointer-events-none z-40"
          style={{
            left: touchData.currentX - 20,
            top: touchData.currentY - 20,
          }}
        >
          <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary/50 animate-ping" />
          <div className="absolute inset-0 w-10 h-10 rounded-full bg-primary/10 animate-pulse" />
        </div>
      )}
    </div>
  );
}

// Hook for easier gesture integration
export const useGestures = () => {
  const [gestureState, setGestureState] = useState({
    isEnabled: true,
    currentGesture: null as string | null,
  });

  const enableGestures = () => setGestureState(prev => ({ ...prev, isEnabled: true }));
  const disableGestures = () => setGestureState(prev => ({ ...prev, isEnabled: false }));
  const toggleGestures = () => setGestureState(prev => ({ ...prev, isEnabled: !prev.isEnabled }));

  return {
    ...gestureState,
    enableGestures,
    disableGestures,
    toggleGestures,
  };
};