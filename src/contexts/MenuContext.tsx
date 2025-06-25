import React, { createContext, useContext, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MenuConfig } from '@/config/types';
import { useSidebarMenu, useMegaMenu, useRootMenu, menuQueryKeys } from '@/hooks/use-menu-api';
import { menuService } from '@/services/organization.service';

interface MenuContextType {
  // Menu data
  sidebarMenu: MenuConfig | undefined;
  megaMenu: MenuConfig | undefined;
  rootMenu: MenuConfig | undefined;
  
  // Loading states
  isSidebarLoading: boolean;
  isMegaLoading: boolean;
  isRootLoading: boolean;
  
  // Error states
  sidebarError: Error | null;
  megaError: Error | null;
  rootError: Error | null;
  
  // Actions
  refreshSidebarMenu: () => Promise<void>;
  refreshMegaMenu: () => Promise<void>;
  refreshRootMenu: () => Promise<void>;
  refreshAllMenus: () => Promise<void>;
  clearMenuCache: () => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

interface MenuProviderProps {
  children: ReactNode;
}

export function MenuProvider({ children }: MenuProviderProps) {
  const queryClient = useQueryClient();
  
  // Use menu hooks
  const {
    data: sidebarMenu,
    isLoading: isSidebarLoading,
    error: sidebarError,
    refetch: refetchSidebar,
  } = useSidebarMenu();
  
  const {
    data: megaMenu,
    isLoading: isMegaLoading,
    error: megaError,
    refetch: refetchMega,
  } = useMegaMenu();
  
  const {
    data: rootMenu,
    isLoading: isRootLoading,
    error: rootError,
    refetch: refetchRoot,
  } = useRootMenu();

  // Action functions
  const refreshSidebarMenu = async () => {
    await refetchSidebar();
  };

  const refreshMegaMenu = async () => {
    await refetchMega();
  };

  const refreshRootMenu = async () => {
    await refetchRoot();
  };

  const refreshAllMenus = async () => {
    await Promise.all([
      refetchSidebar(),
      refetchMega(),
      refetchRoot(),
    ]);
  };

  const clearMenuCache = () => {
    // Clear React Query cache
    queryClient.removeQueries({ queryKey: menuQueryKeys.sidebar });
    queryClient.removeQueries({ queryKey: menuQueryKeys.mega });
    queryClient.removeQueries({ queryKey: menuQueryKeys.root });
    
    // Clear service cache
    menuService.clearCache();
  };

  const contextValue: MenuContextType = {
    // Menu data
    sidebarMenu,
    megaMenu,
    rootMenu,
    
    // Loading states
    isSidebarLoading,
    isMegaLoading,
    isRootLoading,
    
    // Error states
    sidebarError,
    megaError,
    rootError,
    
    // Actions
    refreshSidebarMenu,
    refreshMegaMenu,
    refreshRootMenu,
    refreshAllMenus,
    clearMenuCache,
  };

  return (
    <MenuContext.Provider value={contextValue}>
      {children}
    </MenuContext.Provider>
  );
}

// Custom hook to use menu context
export function useMenuContext(): MenuContextType {
  const context = useContext(MenuContext);
  
  if (context === undefined) {
    throw new Error('useMenuContext must be used within a MenuProvider');
  }
  
  return context;
}

// Hook for specific menu operations
export function useMenuActions() {
  const {
    refreshSidebarMenu,
    refreshMegaMenu,
    refreshRootMenu,
    refreshAllMenus,
    clearMenuCache,
  } = useMenuContext();

  return {
    refreshSidebarMenu,
    refreshMegaMenu,
    refreshRootMenu,
    refreshAllMenus,
    clearMenuCache,
  };
}

// Hook for menu loading states
export function useMenuLoadingStates() {
  const {
    isSidebarLoading,
    isMegaLoading,
    isRootLoading,
  } = useMenuContext();

  const isAnyMenuLoading = isSidebarLoading || isMegaLoading || isRootLoading;
  const areAllMenusLoading = isSidebarLoading && isMegaLoading && isRootLoading;

  return {
    isSidebarLoading,
    isMegaLoading,
    isRootLoading,
    isAnyMenuLoading,
    areAllMenusLoading,
  };
}

// Hook for menu error states
export function useMenuErrors() {
  const {
    sidebarError,
    megaError,
    rootError,
  } = useMenuContext();

  const hasAnyError = !!(sidebarError || megaError || rootError);
  const errors = [sidebarError, megaError, rootError].filter(Boolean);

  return {
    sidebarError,
    megaError,
    rootError,
    hasAnyError,
    errors,
  };
}
