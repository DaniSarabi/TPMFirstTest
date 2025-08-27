import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MaintenanceTemplate } from '@/types/maintenance';
import { ChevronRight, FileText, Folder, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

interface Props {
  groupedTemplates: Record<string, MaintenanceTemplate[]>;
  selectedTemplate: MaintenanceTemplate | null;
  viewMode: 'viewing' | 'creating' | 'editing';
  searchTerm: string;
  expandedFolders: Set<string>; // New prop for state
  onSearchChange: (value: string) => void;
  onSelect: (template: MaintenanceTemplate) => void;
  onEdit: (template: MaintenanceTemplate) => void;
  onDelete: (template: MaintenanceTemplate) => void;
  onToggleFolder: (category: string) => void; // New prop for handling clicks
}

export function TemplateList({
  groupedTemplates,
  selectedTemplate,
  viewMode,
  searchTerm,
  expandedFolders,
  onSearchChange,
  onSelect,
  onEdit,
  onDelete,
  onToggleFolder,
}: Props) {
  return (
    <aside className="lg:col-span-1">
      <Card className="border-0 bg-primary text-primary-foreground shadow-lg drop-shadow-lg">
        <CardHeader className="border-b">
          <CardTitle>Existing Templates</CardTitle>
          <div className="pt-2 pb-3">
            <Input
              className="bg-white text-primary shadow ring ring-black drop-shadow-lg"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col">
            {Object.entries(groupedTemplates).map(([category, templatesInCategory]) => {
              const isExpanded = expandedFolders.has(category);
              return (
                <div key={category}>
                  <button
                    type="button"
                    className="flex w-full items-center px-4 py-2 text-left text-sm font-semibold transition-colors hover:bg-primary/90"
                    onClick={() => onToggleFolder(category)}
                  >
                    <ChevronRight
                      className={cn('mr-2 h-4 w-4 transition-transform', {
                        'rotate-90': isExpanded,
                      })}
                    />
                    <Folder className="mr-2 h-4 w-4" /> {category}
                  </button>
                  {isExpanded && (
                    <div>
                      {templatesInCategory.map((template) => (
                        <div
                          key={template.id}
                          className={cn('group flex w-full items-center border-b pr-2 text-left text-sm last:border-b-0', {
                            'bg-secondary font-semibold': selectedTemplate?.id === template.id && viewMode === 'viewing',
                          })}
                        >
                          <button
                            type="button"
                            onClick={() => onSelect(template)}
                            className="flex flex-grow items-center p-4 pl-12 transition-colors hover:bg-muted/50"
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            {template.name}
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEdit(template)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(template)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
