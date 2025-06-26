import { useQuery, UseQueryResult, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { MenuConfig } from '@/config/types';
import { menuService } from '@/services/organization.service';

// Query keys for different menu types
export const menuQueryKeys = {
  sidebar: ['menu', 'sidebar'] as const,
  mega: ['menu', 'mega'] as const,
  root: ['menu', 'root'] as const,
};

// Hook for sidebar menu with organization change listener
export function useSidebarMenu(): UseQueryResult<MenuConfig, Error> {
  const queryClient = useQueryClient();

  // Listen for organization changes and invalidate menu cache
  useEffect(() => {
    const handleOrganizationChange = () => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.sidebar });
    };

    window.addEventListener('organizationChanged', handleOrganizationChange);

    return () => {
      window.removeEventListener('organizationChanged', handleOrganizationChange);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: menuQueryKeys.sidebar,
    queryFn: () => Promise.resolve([]),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

// Hook for mega menu with organization change listener
export function useMegaMenu(): UseQueryResult<MenuConfig, Error> {
  const queryClient = useQueryClient();

  // Listen for organization changes and invalidate menu cache
  useEffect(() => {
    const handleOrganizationChange = () => {
      queryClient.invalidateQueries({ queryKey: menuQueryKeys.mega });
    };

    window.addEventListener('organizationChanged', handleOrganizationChange);

    return () => {
      window.removeEventListener('organizationChanged', handleOrganizationChange);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: menuQueryKeys.mega,
    queryFn: () => menuService.getMegaMenu(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Hook for root menu
export function useRootMenu(): UseQueryResult<MenuConfig, Error> {
  return useQuery({
    queryKey: menuQueryKeys.root,
    queryFn: () => menuService.getRootMenu(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Generic hook for any menu type
export function useMenuData(menuType: 'sidebar' | 'mega' | 'root'): UseQueryResult<MenuConfig, Error> {
  const queryKey = menuQueryKeys[menuType];
  
  return useQuery({
    queryKey,
    queryFn: () => {
      switch (menuType) {
        case 'sidebar':
          return Promise.resolve([]);
        case 'mega':
          return menuService.getMegaMenu();
        case 'root':
          return menuService.getRootMenu();
        default:
          throw new Error(`Unknown menu type: ${menuType}`);
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
