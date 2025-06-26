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
import { extractOrganizationsFromToken } from '@/services/organization.service';
import { getJWTToken } from '@/utils/auth.utils';
import { Organization } from '@/model/organization.types';

export function SidebarHeader() {
  const { pathname } = useLocation();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);

  useEffect(() => {
    // Get organizations from token
    try {
      const token = getJWTToken();
      const orgs = extractOrganizationsFromToken(token);
      setOrganizations(orgs);
      // Try to get current org from localStorage
      const stored = localStorage.getItem('currentOrganization');
      if (stored) {
        setCurrentOrg(JSON.parse(stored));
      } else if (orgs.length > 0) {
        setCurrentOrg(orgs[0]);
        localStorage.setItem('currentOrganization', JSON.stringify(orgs[0]));
      }
    } catch {
      setOrganizations([]);
      setCurrentOrg(null);
    }
  }, []);

  const handleOrgSelect = (org: Organization) => {
    setCurrentOrg(org);
    localStorage.setItem('currentOrganization', JSON.stringify(org));
    window.dispatchEvent(new CustomEvent('organizationChanged', { detail: org }));
  };

  return (
    <div className="mb-3.5">
      {/* <div className="flex items-center justify-between gap-2.5 px-3.5 h-[70px]">
        <Link to="/">
           <img */}
           <div className="flex flex-col px-3.5 py-2">
           <Link to="/" className="mb-2 flex justify-center">
             <img
            src={toAbsoluteUrl('src/assests/img/explain-logo.svg')}
            className="dark:hidden h-[50px]"
            alt="image"
          />
          <img
            src={toAbsoluteUrl('src/assests/img/explain-logo-dark.svg')}
            className="hidden dark:block h-[50px]"
            alt="image"
          />
        </Link>
        <DropdownMenu>
        <DropdownMenuTrigger className="cursor-pointer text-mono font-medium flex items-center justify-center gap-2 w-fit p-1 rounded-md bg-background border-border mx-auto">
          {/* <DropdownMenuTrigger className="cursor-pointer text-mono font-medium flex items-center justify-between gap-2 w-auto p-1 rounded-md bg-background border-border"> */}
            {currentOrg ? currentOrg.displayName : 'Select Organization'}
            <ChevronDown className="size-3.5! text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={10} side="bottom" align="start">
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleOrgSelect(org)}
                className={cn(currentOrg && org.id === currentOrg.id && 'bg-accent')}
              >
                {org.displayName}
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
            onChange={() => {}}
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
