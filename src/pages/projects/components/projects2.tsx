import { useState, useEffect } from 'react';
import { CardProjectMini, CardProjectRowMini } from '@/partials/cards';
import { LayoutGrid, List } from 'lucide-react';
import { Link } from 'react-router-dom'; // FIXED: use react-router-dom
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { listFolders } from '@/services/file-storage.service';

interface IProjects2Item {
  logo: string;
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  status: {
    variant?: 'primary' | 'mono' | 'destructive' | 'secondary' | 'info' | 'success' | 'warning' | null | undefined;
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
  const [activeView, setActiveView] = useState<'cards' | 'list'>('cards');
  const [projects, setProjects] = useState<IProjects2Items>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const folders = await listFolders('');

        const projectItems: IProjects2Items = folders.map((folder) => ({
          logo: '', // Add logic to assign logo if available
          name: folder.name,
          description: '', // Optional description
          startDate: '',
          endDate: '',
          status: {
            variant: 'primary',
            label: 'Active',
          },
          progress: {
            variant: 'primary',
            value: 50, // Placeholder value
          },
          team: {
            group: [],
          },
        }));

        setProjects(projectItems);
      } catch (error) {
        console.error('Error fetching project folders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const renderProjectCard = (project: IProjects2Item, index: number) => (
    <CardProjectMini
      key={index}
      logo={project.logo}
      name={project.name}
      description={project.description}
      status={project.status}
      progress={project.progress}
      team={project.team}
    />
  );

  const renderProjectRow = (project: IProjects2Item, index: number) => (
    <CardProjectRowMini
      key={index}
      logo={project.logo}
      name={project.name}
      description={project.description}
      status={project.status}
      progress={project.progress}
      team={project.team}
      path=""
    />
  );

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
            if (value === 'cards' || value === 'list') setActiveView(value);
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

      {loading ? (
        <div className="text-center py-6 text-gray-500">Loading projects...</div>
      ) : activeView === 'cards' ? (
        <div id="projects_cards">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
            {projects.map(renderProjectCard)}
          </div>
        </div>
      ) : (
        <div id="projects_list">
          <div className="flex flex-col gap-5 lg:gap-7.5">
            {projects.map(renderProjectRow)}
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
