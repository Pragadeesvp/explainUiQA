import { MenuConfig, MenuItem } from '@/config/types';

// Utility functions for menu operations

/**
 * Find a menu item by path
 */
export function findMenuItemByPath(menuItems: MenuConfig, path: string): MenuItem | null {
  for (const item of menuItems) {
    if (item.path === path) {
      return item;
    }
    
    if (item.children) {
      const found = findMenuItemByPath(item.children, path);
      if (found) {
        return found;
      }
    }
  }
  
  return null;
}

/**
 * Get all menu paths (flattened)
 */
export function getAllMenuPaths(menuItems: MenuConfig): string[] {
  const paths: string[] = [];
  
  function collectPaths(items: MenuConfig) {
    for (const item of items) {
      if (item.path) {
        paths.push(item.path);
      }
      
      if (item.children) {
        collectPaths(item.children);
      }
    }
  }
  
  collectPaths(menuItems);
  return paths;
}

/**
 * Filter menu items based on user permissions
 */
export function filterMenuByPermissions(
  menuItems: MenuConfig,
  userPermissions: string[]
): MenuConfig {
  return menuItems
    .filter(item => {
      // If no permission required, show the item
      if (!item.badge) {
        return true;
      }
      
      // Check if user has required permission
      return userPermissions.includes(item.badge);
    })
    .map(item => ({
      ...item,
      children: item.children 
        ? filterMenuByPermissions(item.children, userPermissions)
        : undefined,
    }))
    .filter(item => {
      // Remove items that have no children after filtering
      if (item.children) {
        return item.children.length > 0;
      }
      return true;
    });
}

/**
 * Sort menu items by order or title
 */
export function sortMenuItems(menuItems: MenuConfig): MenuConfig {
  return menuItems
    .sort((a, b) => {
      // Sort by title if no order specified
      const titleA = a.title || '';
      const titleB = b.title || '';
      return titleA.localeCompare(titleB);
    })
    .map(item => ({
      ...item,
      children: item.children ? sortMenuItems(item.children) : undefined,
    }));
}

/**
 * Get breadcrumb trail for a given path
 */
export function getBreadcrumbTrail(menuItems: MenuConfig, targetPath: string): MenuItem[] {
  const trail: MenuItem[] = [];
  
  function findTrail(items: MenuConfig, path: string): boolean {
    for (const item of items) {
      trail.push(item);
      
      if (item.path === path) {
        return true;
      }
      
      if (item.children && findTrail(item.children, path)) {
        return true;
      }
      
      trail.pop();
    }
    
    return false;
  }
  
  findTrail(menuItems, targetPath);
  return trail;
}

/**
 * Check if a menu item or its children are active
 */
export function isMenuItemActive(item: MenuItem, currentPath: string): boolean {
  if (item.path === currentPath) {
    return true;
  }
  
  if (item.rootPath && currentPath.startsWith(item.rootPath)) {
    return true;
  }
  
  if (item.children) {
    return item.children.some(child => isMenuItemActive(child, currentPath));
  }
  
  return false;
}

/**
 * Transform menu items for different display formats
 */
export function transformMenuForDisplay(
  menuItems: MenuConfig,
  options: {
    maxDepth?: number;
    showIcons?: boolean;
    showBadges?: boolean;
  } = {}
): MenuConfig {
  const { maxDepth = Infinity, showIcons = true, showBadges = true } = options;
  
  function transform(items: MenuConfig, currentDepth: number = 0): MenuConfig {
    if (currentDepth >= maxDepth) {
      return [];
    }
    
    return items.map(item => ({
      ...item,
      icon: showIcons ? item.icon : undefined,
      badge: showBadges ? item.badge : undefined,
      children: item.children 
        ? transform(item.children, currentDepth + 1)
        : undefined,
    }));
  }
  
  return transform(menuItems);
}

/**
 * Merge menu configurations
 */
export function mergeMenuConfigs(...configs: MenuConfig[]): MenuConfig {
  const merged: MenuConfig = [];
  const itemMap = new Map<string, MenuItem>();
  
  for (const config of configs) {
    for (const item of config) {
      const key = item.path || item.title || '';
      
      if (itemMap.has(key)) {
        // Merge with existing item
        const existing = itemMap.get(key)!;
        const mergedItem: MenuItem = {
          ...existing,
          ...item,
          children: existing.children || item.children 
            ? mergeMenuConfigs(existing.children || [], item.children || [])
            : undefined,
        };
        itemMap.set(key, mergedItem);
      } else {
        itemMap.set(key, item);
      }
    }
  }
  
  return Array.from(itemMap.values());
}

/**
 * Validate menu configuration
 */
export function validateMenuConfig(menuItems: MenuConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const paths = new Set<string>();
  
  function validate(items: MenuConfig, level: number = 0) {
    for (const item of items) {
      // Check for required fields
      if (!item.title && !item.separator) {
        errors.push(`Menu item at level ${level} missing title`);
      }
      
      // Check for duplicate paths
      if (item.path) {
        if (paths.has(item.path)) {
          errors.push(`Duplicate path found: ${item.path}`);
        } else {
          paths.add(item.path);
        }
      }
      
      // Validate children
      if (item.children) {
        validate(item.children, level + 1);
      }
    }
  }
  
  validate(menuItems);
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
