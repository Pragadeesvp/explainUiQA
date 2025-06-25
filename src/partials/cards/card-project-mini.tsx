import { Link } from 'react-router';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AvatarGroup } from '../common/avatar-group';

interface IProjectMiniProps {
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
}

const CardProjectMini = ({
  logo,
  name,
  description,
  status,
  progress,
  team,
}: IProjectMiniProps) => {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-2">
        {/* <div className="flex items-center justify-center size-6 rounded bg-accent/60">
          <img
            src={toAbsoluteUrl(`/media/brand-logos/${logo}`)}
            className="size-4"
            alt="image"
          />
        </div> */}
        <Badge size="xs" variant={status.variant} appearance="outline">
          {status.label}
        </Badge>
      </div>

      <div className="flex flex-col mb-2">
        <Link
          to="#"
          className="text-xs font-medium text-mono hover:text-primary-active mb-0.5 line-clamp-1"
        >
          {name}
        </Link>
        <span className="text-[10px] text-secondary-foreground line-clamp-1 leading-tight">
          {description}
        </span>
      </div>

      <Progress
        value={progress?.value}
        indicatorClassName={progress?.variant}
        className="h-0.5 mb-2"
      />

      <AvatarGroup
        group={team.group}
        size="size-4"
        more={team.more}
      />
    </Card>
  );
};

export { CardProjectMini, type IProjectMiniProps };
