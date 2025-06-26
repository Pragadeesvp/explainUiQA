import { useState } from 'react';
import { CardProjectMini, CardProjectRowMini } from '@/partials/cards';
import { LayoutGrid, List } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface IProjects2Item {
  logo: string;
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
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

type IProjects2Items = Array<IProjects2Item>;

const Projects2 = () => {
  const [activeView, setActiveView] = useState('cards');

  const projects: IProjects2Items = [
    {
      logo: 'plurk.svg',
      name: 'Phoenix SaaS',
      description: 'Real-time photo sharing app',
      startDate: 'Mar 06',
      endDate: 'Dec 21',
      status: {
        label: 'In Progress',
        variant: 'primary',
      },
      progress: {
        variant: 'bg-primary',
        value: 55,
      },
      team: {
        size: 'size-[30px]',
        group: [
          { filename: '300-4.png' },
          { filename: '300-2.png' },
          {
            fallback: 'S',
            variant: 'text-primary-foreground ring-background bg-primary',
          },
        ],
      },
    },
    {
      logo: 'telegram.svg',
      name: 'Radiant Wave',
      description: 'Short-term accommodation marketplace',
      status: {
        label: 'Completed',
        variant: 'success',
      },
      progress: {
        variant: 'bg-green-500',
        value: 100,
      },
      team: {
        size: 'size-[30px]',
        group: [{ filename: '300-24.png' }, { filename: '300-7.png' }],
      },
    },
  ];

  const renderProject = (project: IProjects2Item, index: number) => {
    return (
      <CardProjectMini
        logo={project.logo}
        name={project.name}
        description={project.description}
        status={project.status}
        progress={project.progress}
        team={project.team}
        key={index}
      />
    );
  };

  const renderItem = (item: IProjects2Item, index: number) => {
    return (
      <CardProjectRowMini
        logo={item.logo}
        name={item.name}
        description={item.description}
        status={item.status}
        progress={item.progress}
        team={item.team}
        key={index}
        path=''
      />
    );
  };

  return (
    <div className="flex flex-col items-stretch gap-5 lg:gap-7.5">
      <div className="flex flex-wrap items-center gap-5 justify-between">
        <h3 className="text-lg text-mono font-semibold">
          {projects.length} Projects
        </h3>
        <ToggleGroup
          type="single"
          variant="outline"
          value={activeView}
          onValueChange={(value) => {
            if (value) setActiveView(value);
          }}
        >
          <ToggleGroupItem value="cards">
            <LayoutGrid size={16} />
          </ToggleGroupItem>
          <ToggleGroupItem value="list">
            <List size={16} />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      {activeView === 'cards' && (
        <div id="projects_cards">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
            {projects.map((project, index) => {
              return renderProject(project, index);
            })}
          </div>
          {/* <div className="flex grow justify-center pt-5 lg:pt-7.5">
            <Button mode="link" underlined="dashed" asChild>
              <Link to="#">Show more projects</Link>
            </Button>
          </div> */}
        </div>
      )}
      {activeView === 'list' && (
        <div id="projects_list">
          <div className="flex flex-col gap-5 lg:gap-7.5">
            {projects.map((item, index) => {
              return renderItem(item, index);
            })}
          </div>
          <div className="flex grow justify-center pt-5 lg:pt-7.5">
            <Button mode="link" underlined="dashed" asChild>
              <Link to="#">Show more projects</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export { Projects2, type IProjects2Item, type IProjects2Items };
