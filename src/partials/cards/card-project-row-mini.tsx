import { EllipsisVertical } from 'lucide-react';
import { Link } from 'react-router';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AvatarGroup } from '../common/avatar-group';
import { DropdownMenu3 } from '../dropdown-menu/dropdown-menu-3';

interface IProjectRowMiniProps {
  logo: string;
  name: string;
  description: string;
  status: {
    variant?:
      | 'primary'
      | 'mono'
      | 'destructive'
      | 'secondary'
      | 'info'
      | 'success'
      | 'warning'
      | null
      | undefined;
    label: string;
  };
  progress: {
    variant: string;
    value: number;
  };
  team: {
    size?: string;
    group: Array<{ filename?: string; variant?: string; fallback?: string }>;
    more?: {
      variant?: string;
      number?: number;
    };
  };
  path: string | '#';
}

const CardProjectRowMini = ({
  logo,
  name,
  description,
  status,
  progress,
  team,
  path,
}: IProjectRowMiniProps) => {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex items-center justify-center size-8 shrink-0 rounded bg-accent/60">
            <img
              src={toAbsoluteUrl(`/media/brand-logos/${logo}`)}
              className="size-5"
              alt="image"
            />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <Link
              to={path}
              className="text-sm font-medium text-mono hover:text-primary-active truncate"
            >
              {name}
            </Link>
            <span className="text-xs text-secondary-foreground truncate">
              {description}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <Badge size="xs" variant={status.variant} appearance="outline">
            {status.label}
          </Badge>
          
          <Progress
            value={progress?.value}
            indicatorClassName={progress?.variant}
            className="h-1 w-16"
          />
          
          <div className="w-12 flex justify-end">
            <AvatarGroup
              group={team.group}
              size="size-4"
              more={team.more}
            />
          </div>
          
          <DropdownMenu3
            trigger={
              <Button variant="ghost" mode="icon" size="icon">
                <EllipsisVertical className="size-3" />
              </Button>
            }
          />
        </div>
      </div>
    </Card>
  );
};

export { CardProjectRowMini, type IProjectRowMiniProps };
