import { useEffect, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { MENU_ROOT } from '@/config/menu.config';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

export function SidebarHeader() {
  const { pathname } = useLocation();
  const [selectedMenuItem, setSelectedMenuItem] = useState(MENU_ROOT[1]);

  const handleInputChange = () => {};

  useEffect(() => {
    MENU_ROOT.forEach((item) => {
      if (item.rootPath && pathname.includes(item.rootPath)) {
        setSelectedMenuItem(item);
      }
    });
  }, [pathname]);

  return (
    <div className="mb-3.5">
      <div className="flex items-center justify-between gap-2.5 px-3.5 h-[70px]">
        <Link to="/">
           <img
            src={toAbsoluteUrl('src/assests/img/explain-logo.svg')}
            className="dark:hidden h-[50px]"
            alt="image"
          />
          <img
            src={toAbsoluteUrl('src/assests/img/explain-logo.svg')}
            className="hidden dark:block h-[50px]"
            alt="image"
          />
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer text-mono font-medium flex items-center justify-between gap-2 w-[auto] p-1 rounded-md bg-background border-border">
           Staging
            <ChevronDown className="size-3.5! text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={10} side="bottom" align="start">
            {MENU_ROOT.map((item, index) => (
              <DropdownMenuItem
                key={index}
                asChild
                className={cn(item === selectedMenuItem && 'bg-accent')}
              >
                <Link to={item.path || ''}>
                  {item.icon && <item.icon />}
                  {item.title}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="pt-2.5 px-3.5 mb-1">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 start-3.5 -translate-y-1/2 size-4" />
          <Input
            placeholder="Search"
            onChange={handleInputChange}
            className="px-9 min-w-0"
            value=""
          />
          <span className="text-xs text-muted-foreground absolute end-3.5 top-1/2 -translate-y-1/2">
            cmd + /
          </span>
        </div>
      </div>
    </div>
  );
}
