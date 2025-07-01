// src/hooks/useScrollHeader.ts
import { useState, useEffect, useCallback } from 'react';

interface ScrollHeaderState {
  isVisible: boolean;
  isScrolled: boolean;
  scrollDirection: 'up' | 'down';
}

interface UseScrollHeaderOptions {
  threshold?: number; // Minimum scroll distance to trigger hide/show
  debounceMs?: number; // Debounce scroll events
  hideOnDownScroll?: boolean; // Whether to hide on down scroll
}

export const useScrollHeader = (options: UseScrollHeaderOptions = {}) => {
  const {
    threshold = 100,
    debounceMs = 10,
    hideOnDownScroll = true
  } = options;

  const [state, setState] = useState<ScrollHeaderState>({
    isVisible: true,
    isScrolled: false,
    scrollDirection: 'up'
  });

  const [lastScrollY, setLastScrollY] = useState(0);
  const [ticking, setTicking] = useState(false);

  const updateScrollState = useCallback(() => {
    const scrollY = window.scrollY;
    const scrollDirection = scrollY > lastScrollY ? 'down' : 'up';
    const isScrolled = scrollY > threshold;
    
    // Determine visibility based on scroll behavior
    let isVisible = true;
    
    if (hideOnDownScroll && isScrolled) {
      if (scrollDirection === 'down' && scrollY > lastScrollY + 10) {
        isVisible = false;
      } else if (scrollDirection === 'up' && scrollY < lastScrollY - 10) {
        isVisible = true;
      } else {
        // Keep current state if scroll change is too small
        isVisible = state.isVisible;
      }
    }

    // Always show when near the top
    if (scrollY < threshold / 2) {
      isVisible = true;
    }

    setState({
      isVisible,
      isScrolled,
      scrollDirection
    });

    setLastScrollY(scrollY);
    setTicking(false);
  }, [lastScrollY, threshold, hideOnDownScroll, state.isVisible]);

  const requestTick = useCallback(() => {
    if (!ticking) {
      setTicking(true);
      requestAnimationFrame(updateScrollState);
    }
  }, [ticking, updateScrollState]);

  useEffect(() => {
    let timeoutId: number;

    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(requestTick, debounceMs);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [requestTick, debounceMs]);

  // Return both state and helper functions
  return {
    ...state,
    // Helper functions for CSS classes
    getHeaderClasses: () => {
      const classes = ['navigation-header'];
      
      if (state.isVisible) {
        classes.push('header-visible');
      } else {
        classes.push('header-hidden');
      }
      
      if (state.isScrolled) {
        classes.push('header-scrolled');
      }
      
      return classes.join(' ');
    },
    
    // Manual control functions (if needed)
    forceShow: () => setState(prev => ({ ...prev, isVisible: true })),
    forceHide: () => setState(prev => ({ ...prev, isVisible: false })),
  };
};