"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { HelpModal } from "@/components/help/HelpModal";

interface HelpModalContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleHelp: () => void;
  closeHelp: () => void;
  openHelp: () => void;
}

const HelpModalContext = createContext<HelpModalContextType | null>(null);

export function useHelpModal() {
  const context = useContext(HelpModalContext);
  if (!context) {
    throw new Error('useHelpModal must be used within HelpModalProvider');
  }
  return context;
}

interface HelpModalProviderProps {
  children: ReactNode;
}

export function HelpModalProvider({ children }: HelpModalProviderProps) {
  const [open, setOpen] = useState(false);

  const toggleHelp = useCallback(() => {
    setOpen(prev => !prev);
  }, []);

  const closeHelp = useCallback(() => {
    setOpen(false);
  }, []);

  const openHelp = useCallback(() => {
    setOpen(true);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + ? for help
      if ((event.ctrlKey || event.metaKey) && event.key === '?') {
        event.preventDefault();
        toggleHelp();
      }
      
      // F1 for help
      if (event.key === 'F1') {
        event.preventDefault();
        openHelp();
      }
      
      // Escape to close
      if (event.key === 'Escape' && open) {
        event.preventDefault();
        closeHelp();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, toggleHelp, closeHelp, openHelp]);

  const value = {
    open,
    setOpen,
    toggleHelp,
    closeHelp,
    openHelp,
  };

  return (
    <HelpModalContext.Provider value={value}>
      {children}
      <HelpModal open={open} onOpenChange={setOpen} />
    </HelpModalContext.Provider>
  );
}