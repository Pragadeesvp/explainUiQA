import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MenuConfig, MenuItem as BaseMenuItem } from '@/config/types';
import { useSidebarMenu, useMegaMenu, useRootMenu, menuQueryKeys } from '@/hooks/use-menu-api';
import { menuService } from '@/services/organization.service';
import { listFolders } from '@/services/file-storage.service';
import { Calendar, LucideIcon, Users } from 'lucide-react';

// Extended MenuItem with icon and custom props
export interface MenuItem extends BaseMenuItem {
  icon?: LucideIcon;
  isLoading?: boolean;
  type?: 'folder' | 'file';
  children?: MenuItem[]; // Include nested items
}

interface MenuContextType {
  sidebarMenu: MenuConfig | undefined;
  megaMenu: MenuConfig | undefined;
  rootMenu: MenuConfig | undefined;
  dynamicMenuItems: MenuItem[];
  openMenuItem: string | undefined;
  isSidebarLoading: boolean;
  isMegaLoading: boolean;
  isRootLoading: boolean;
  isDynamicMenuLoading: boolean;
  sidebarError: Error | null;
  megaError: Error | null;
  rootError: Error | null;
  dynamicMenuError: string | null;
  refreshSidebarMenu: () => Promise<void>;
  refreshMegaMenu: () => Promise<void>;
  refreshRootMenu: () => Promise<void>;
  refreshAllMenus: () => Promise<void>;
  clearMenuCache: () => void;
  loadDynamicSubMenu: (path: string) => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

interface MenuProviderProps {
  children: ReactNode;
}

export function MenuProvider({ children }: MenuProviderProps) {
  const queryClient = useQueryClient();
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

  const [dynamicMenuItems, setDynamicMenuItems] = useState<MenuItem[]>([]);
  const [isDynamicMenuLoading, setIsDynamicMenuLoading] = useState(true);
  const [dynamicMenuError, setDynamicMenuError] = useState<string | null>(null);
  const [openMenuItem, setOpenMenuItem] = useState<string | undefined>();

  // Load dynamic menu (Dashboard + Projects with Year Folders)
  useEffect(() => {
    const loadDynamicMenu = async () => {
      try {
        setIsDynamicMenuLoading(true);

        const dashboardItem: MenuItem = {
          title: 'Dashboard',
          path: '/dashboard',
          type: 'file',
        };

        const projects = await listFolders(''); // Get project folders

        const projectItems: MenuItem[] = await Promise.all(
          projects.map(async (proj) => {
            const yearFolders = await listFolders(proj.name); // Get year folders inside project

            const children: MenuItem[] = yearFolders.map((folder) => ({
              title: folder.name,
              icon: Calendar,
              path: folder.fullPath,
              type: 'file',
            }));

            return {
              title: proj.name,
              path: proj.fullPath,
              type: 'folder',
              children,
            };
          })
        );

        const projectsParentItem: MenuItem = {
          title: 'Projects',
          icon: Users,
          path: 'projects-root',
          type: 'folder',
          children: projectItems,
        };

        setDynamicMenuItems([dashboardItem, projectsParentItem]);
      } catch (err) {
        console.error('Dynamic menu load failed:', err);
        setDynamicMenuError('Failed to load projects');
      } finally {
        setIsDynamicMenuLoading(false);
      }
    };

    loadDynamicMenu();
  }, []);

  const loadDynamicSubMenu = async (path: string) => {
    setOpenMenuItem(path);
    if (path === 'projects-root') return;
    // Placeholder: Lazy loading logic can be added here if needed
  };

  const refreshSidebarMenu = async () => { await refetchSidebar(); };
  const refreshMegaMenu = async () => { await refetchMega(); };
  const refreshRootMenu = async () => { await refetchRoot(); };
  const refreshAllMenus = async () => {
    await Promise.all([refetchSidebar(), refetchMega(), refetchRoot()]);
  };

  const clearMenuCache = () => {
    queryClient.removeQueries({ queryKey: menuQueryKeys.sidebar });
    queryClient.removeQueries({ queryKey: menuQueryKeys.mega });
    queryClient.removeQueries({ queryKey: menuQueryKeys.root });
    menuService.clearCache();
  };

  const contextValue: MenuContextType = {
    sidebarMenu,
    megaMenu,
    rootMenu,
    dynamicMenuItems,
    openMenuItem,
    isSidebarLoading,
    isMegaLoading,
    isRootLoading,
    isDynamicMenuLoading,
    sidebarError,
    megaError,
    rootError,
    dynamicMenuError,
    refreshSidebarMenu,
    refreshMegaMenu,
    refreshRootMenu,
    refreshAllMenus,
    clearMenuCache,
    loadDynamicSubMenu,
  };

  return (
    <MenuContext.Provider value={contextValue}>
      {children}
    </MenuContext.Provider>
  );
}

// Custom Hooks
export function useMenuContext(): MenuContextType {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenuContext must be used within a MenuProvider');
  }
  return context;
}

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
