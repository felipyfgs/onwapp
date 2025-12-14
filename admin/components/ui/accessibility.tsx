"use client";

import React from "react";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface AccessibilityProps {
  children: React.ReactNode;
  className?: string;
}

// Skip to main content link for screen readers
export function SkipToMain({ className }: { className?: string }) {
  return (
    <a
      href="#main-content"
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground p-2 rounded-md focus-ring",
        className
      )}
    >
      Pular para o conteúdo principal
    </a>
  );
}

// Focus trap for modals and dropdowns
export function useFocusTrap(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }

      // Escape to close
      if (event.key === 'Escape') {
        event.preventDefault();
        document.dispatchEvent(new CustomEvent('closeModal'));
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus first element when trap is activated
    const firstFocusable = document.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    firstFocusable?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);
}

// Announcer for screen readers
export function useAnnouncer() {
  const announce = (message: string, priority: "polite" | "assertive" = "polite") => {
    const announcer = document.getElementById('screen-reader-announcer');
    if (announcer) {
      announcer.textContent = message;
      announcer.setAttribute('aria-live', priority);

      // Clear after announcement
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  };

  // Create announcer element if it doesn't exist
  useEffect(() => {
    if (!document.getElementById('screen-reader-announcer')) {
      const announcer = document.createElement('div');
      announcer.id = 'screen-reader-announcer';
      announcer.className = 'sr-only';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      document.body.appendChild(announcer);
    }
  }, []);

  return { announce };
}

// High contrast toggle
export function HighContrastToggle({ className }: { className?: string }) {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  return (
    <button
      onClick={() => setIsHighContrast(!isHighContrast)}
      className={cn(
        "p-2 rounded-md border bg-background hover:bg-muted focus-ring",
        className
      )}
      aria-label="Alternar alto contraste"
      aria-pressed={isHighContrast}
    >
      <span className="sr-only">Alto contraste</span>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
        <circle cx="10" cy="10" r="3" fill="currentColor" />
      </svg>
    </button>
  );
}

// Reduced motion toggle
export function ReducedMotionToggle({ className }: { className?: string }) {
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isReducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [isReducedMotion]);

  return (
    <button
      onClick={() => setIsReducedMotion(!isReducedMotion)}
      className={cn(
        "p-2 rounded-md border bg-background hover:bg-muted focus-ring",
        className
      )}
      aria-label="Alternar animações"
      aria-pressed={isReducedMotion}
    >
      <span className="sr-only">Reduzir animações</span>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M10 2L4 8l6 6M4 12l6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

// Font size controls
export function FontSizeControls({ className }: { className?: string }) {
  const [fontSize, setFontSize] = useState('medium');

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-font-size', fontSize);
  }, [fontSize]);

  const increaseFontSize = () => {
    const sizes = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex < sizes.length - 1) {
      setFontSize(sizes[currentIndex + 1]);
    }
  };

  const decreaseFontSize = () => {
    const sizes = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex > 0) {
      setFontSize(sizes[currentIndex - 1]);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="text-sm text-muted-foreground">Tamanho:</span>
      <button
        onClick={decreaseFontSize}
        className="p-1 rounded hover:bg-muted focus-ring"
        aria-label="Diminuir fonte"
        disabled={fontSize === 'small'}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 8h8M4 4h8" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      <button
        onClick={() => setFontSize('medium')}
        className={cn(
          "px-2 py-1 rounded text-sm focus-ring",
          fontSize === 'medium' && 'bg-primary text-primary-foreground'
        )}
        aria-label="Fonte média"
      >
        A
      </button>
      <button
        onClick={increaseFontSize}
        className="p-1 rounded hover:bg-muted focus-ring"
        aria-label="Aumentar fonte"
        disabled={fontSize === 'large'}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 4h8M4 12h8" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
    </div>
  );
}

// Accessibility wrapper
export function AccessibilityWrapper({
  children,
  className
}: AccessibilityProps) {
  return (
    <div className={cn("accessibility-enabled", className)}>
      <SkipToMain />
      <div id="main-content" role="main">
        {children}
      </div>

      {/* Accessibility controls */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 p-3 bg-background border rounded-lg shadow-lg z-50">
        <HighContrastToggle />
        <ReducedMotionToggle />
        <FontSizeControls />
      </div>

      {/* Screen reader announcer */}
      <div
        id="screen-reader-announcer"
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
    </div>
  );
}

// Custom hooks for accessibility features
function useState(initialValue: any) {
  const [value, setValue] = React.useState(initialValue);
  return [value, setValue];
}