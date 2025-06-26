export interface ProjectItem {
  name: string;
  fullPath: string;
  type: 'folder' | 'file';
  years?: ProjectItem[];
  isExpanded?: boolean;
}
