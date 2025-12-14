"use client";

import { useEffect, useRef, useCallback, useState } from "react";

// Intersection Observer for lazy loading
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  callback: () => void,
  options: IntersectionObserverInit = { threshold: 0.1 }
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback();
        }
      });
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, callback, options]);
}

// Virtual scrolling for large lists
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + overscan,
    items.length
  );
  const visibleItems = items.slice(visibleStart, visibleEnd);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    containerRef,
    visibleItems,
    visibleStart,
    visibleEnd,
    handleScroll,
    totalHeight: items.length * itemHeight,
    scrollTop
  };
}

// Image lazy loading with blur-up effect
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !img.src) {
          img.src = src;
        }
      });
    });

    observer.observe(img);

    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      observer.disconnect();
    };

    return () => {
      observer.disconnect();
    };
  }, [src, placeholder]);

  return {
    imgRef,
    imageSrc,
    isLoaded,
    style: {
      filter: isLoaded ? 'none' : 'blur(20px)',
      transition: 'filter 0.3s ease-out'
    }
  };
}

// Debounced resize observer
export function useResizeObserver(callback: () => void, delay: number = 250) {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    const handleResize = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback();
      }, delay);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [callback, delay]);
}

// Performance monitoring
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    fcp: 0, // First Contentful Paint
    lcp: 0, // Largest Contentful Paint
    fid: 0, // First Input Delay
    cls: 0  // Cumulative Layout Shift
  });

  useEffect(() => {
    // Measure FCP
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
        }
        
        if (entry.name === 'largest-contentful-paint') {
          setMetrics(prev => ({ ...prev, lcp: entry.startTime }));
        }
      }
    });

    observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });

    // Measure CLS
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value || 0;
        }
      }
      setMetrics(prev => ({ ...prev, cls: clsValue }));
    });

    clsObserver.observe({ entryTypes: ['layout-shift'], buffered: true });

    // Measure FID
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const firstInput = entry as PerformanceEntry & { processingStart?: number };
        if (entry.name === 'first-input') {
          setMetrics(prev => ({ ...prev, fid: (firstInput.processingStart || 0) - entry.startTime }));
        }
      }
    });

    fidObserver.observe({ entryTypes: ['first-input'], buffered: true });

    return () => {
      observer.disconnect();
      clsObserver.disconnect();
      fidObserver.disconnect();
    };
  }, []);

  return metrics;
}

// Memory usage monitoring
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState({
    used: 0,
    total: 0,
    percentage: 0
  });

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          used: Math.round(memory.usedJSHeapSize / 1048576), // MB
          total: Math.round(memory.totalJSHeapSize / 1048576), // MB
          percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)
        });
      }
    };

    const interval = setInterval(updateMemoryInfo, 5000);
    updateMemoryInfo();

    return () => {
      clearInterval(interval);
    };
  }, []);

  return memoryInfo;
}

// Network status monitoring
interface NetworkInfo {
  online: boolean;
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  downlink: number;
  rtt: number;
}

export function useNetworkStatus() {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    effectiveType: '4g',
    downlink: 10,
    rtt: 100
  });

  useEffect(() => {
    const updateNetworkInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setNetworkInfo({
          online: navigator.onLine,
          effectiveType: connection.effectiveType || '4g',
          downlink: connection.downlink || 10,
          rtt: connection.rtt || 100
        });
      }
    };

    const handleOnline = () => updateNetworkInfo();
    const handleOffline = () => updateNetworkInfo();
    const handleConnectionChange = () => updateNetworkInfo();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = (navigator as Navigator & { connection?: EventTarget }).connection;
    connection?.addEventListener('change', handleConnectionChange);

    updateNetworkInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      connection?.removeEventListener('change', handleConnectionChange);
    };
  }, []);

  return networkInfo;
}

// Component preloading
export function useComponentPreload() {
  const [preloadedComponents, setPreloadedComponents] = useState<Set<string>>(new Set());

  const preloadComponent = useCallback((componentPath: string) => {
    if (!preloadedComponents.has(componentPath)) {
      const link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = componentPath;
      document.head.appendChild(link);
      
      setPreloadedComponents(prev => new Set(prev).add(componentPath));
    }
  }, [preloadedComponents]);

  return { preloadComponent, preloadedComponents };
}

// Service Worker registration
export function useServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((error) => {
          console.log('SW registration failed: ', error);
        });
    }
  }, []);
}