"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { GlobalSearch } from "@/components/search/GlobalSearch";

interface GlobalSearchContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleSearch: () => void;
  closeSearch: () => void;
  openSearch: () => void;
}

const GlobalSearchContext = createContext<GlobalSearchContextType | null>(null);

export function useGlobalSearch() {
  const context = useContext(GlobalSearchContext);
  if (!context) {
    throw new Error('useGlobalSearch must be used within GlobalSearchProvider');
  }
  return context;
}

interface GlobalSearchProviderProps {
  children: ReactNode;
}

export function GlobalSearchProvider({ children }: GlobalSearchProviderProps) {
  const [open, setOpen] = useState(false);

  const toggleSearch = useCallback(() => {
    setOpen(prev => !prev);
  }, []);

  const closeSearch = useCallback(() => {
    setOpen(false);
  }, []);

  const openSearch = useCallback(() => {
    setOpen(true);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K for global search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        toggleSearch();
      }
      
      // Escape to close
      if (event.key === 'Escape' && open) {
        event.preventDefault();
        closeSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, toggleSearch, closeSearch]);

  const value = {
    open,
    setOpen,
    toggleSearch,
    closeSearch,
    openSearch,
  };

  return (
    <GlobalSearchContext.Provider value={value}>
      {children}
      <GlobalSearch open={open} onOpenChange={setOpen} />
    </GlobalSearchContext.Provider>
  );
}