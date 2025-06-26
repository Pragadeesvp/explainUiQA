'use client';

import { JSX, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AccordionMenu,
  AccordionMenuClassNames,
  AccordionMenuGroup,
  AccordionMenuItem,
  AccordionMenuSub,
  AccordionMenuSubContent,
  AccordionMenuSubTrigger,
} from '@/components/ui/accordion-menu';
import { FileText, Folder, Calendar,LayoutGrid } from 'lucide-react';
import { useMenuContext, MenuItem } from '@/contexts/MenuContext';

export function SidebarMenuPrimary() {
  const { pathname } = useLocation();
  const {
    dynamicMenuItems,
    isDynamicMenuLoading,
    dynamicMenuError,
    loadDynamicSubMenu,
    openMenuItem,
  } = useMenuContext();

  const matchPath = useCallback(
    (path: string): boolean =>
      path === pathname || (path.length > 1 && pathname.startsWith(path)),
    [pathname],
  );

  const classNames: AccordionMenuClassNames = {
    root: 'space-y-2.5 px-3.5',
    group: 'gap-px',
    label: 'uppercase text-xs font-medium text-muted-foreground/70 pt-2.25 pb-px',
    separator: '',
    item: 'h-9 hover:bg-transparent border border-transparent text-accent-foreground hover:text-mono data-[selected=true]:text-mono data-[selected=true]:bg-background data-[selected=true]:border-border data-[selected=true]:font-medium',
    sub: '',
    subTrigger: 'h-9 hover:bg-transparent border border-transparent text-accent-foreground hover:text-mono data-[selected=true]:text-mono data-[selected=true]:bg-background data-[selected=true]:border-border data-[selected=true]:font-medium',
    subContent: 'py-0 ps-4 relative',
    indicator: '',
  };
  
  const buildMenu = (items: MenuItem[]): JSX.Element[] => {
    return items.map((item) => {
      if (item.type === 'folder' && item.path) {
        const Icon = item.icon || Folder;
        return (
          <AccordionMenuSub key={item.path} value={item.path}>
            <AccordionMenuSubTrigger
              className="text-sm font-medium"
            >
              <Icon data-slot="accordion-menu-icon" className="w-4 h-4 me-2" />
              <span data-slot="accordion-menu-title">{item.title}</span>
              {item.isLoading && <div className="spinner-border spinner-border-sm ms-auto"></div>}
            </AccordionMenuSubTrigger>
            <AccordionMenuSubContent
              type="single"
              collapsible
              parentValue={item.path!}
            >
              <AccordionMenuGroup>
                {item.children && item.children.length > 0 ? (
                  buildMenu(item.children)
                ) : (
                  !item.isLoading && <AccordionMenuItem value="" disabled className="text-xs text-muted-foreground ps-8">No items</AccordionMenuItem>
                )}
              </AccordionMenuGroup>
            </AccordionMenuSubContent>
          </AccordionMenuSub>
        );
      } else if (item.path) {
        // Render file item - handle both S3 files and special links like Dashboard
        const isExternalLink = item.path.startsWith('/');
        const linkTarget = isExternalLink ? item.path : `/file/${item.path}`;
        const Icon = item.icon || (isExternalLink ? LayoutGrid : FileText);

        return (
          <AccordionMenuItem
            key={item.path}
            value={item.path}
            className="text-sm font-medium"
          >
            <Link to={linkTarget} className="flex items-center">
              <Icon data-slot="accordion-menu-icon" className="w-4 h-4 me-2" />
              <span data-slot="accordion-menu-title">{item.title}</span>
            </Link>
          </AccordionMenuItem>
        );
      }
      return null;
    }).filter(Boolean) as JSX.Element[];
  };

  if (isDynamicMenuLoading) {
    return (
      <div className="px-3.5 py-4">
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-9 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (dynamicMenuError) {
    return (
      <div className="px-3.5 py-4 text-red-500">
        Error: {dynamicMenuError}
      </div>
    );
  }

  return (
    <AccordionMenu
      type="single"
      value={openMenuItem}
      onValueChange={loadDynamicSubMenu}
      collapsible
      classNames={classNames}
      matchPath={matchPath}
    >
      {buildMenu(dynamicMenuItems)}
    </AccordionMenu>
  );
}
