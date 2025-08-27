import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import AppLayout from '@/layouts/app-layout';
import GeneralSettingsLayout from '@/layouts/general-settings-layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { MaintenanceTemplate } from '@/types/maintenance';
import { Head, router } from '@inertiajs/react';
import { PlusCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MaintenanceTemplateForm } from './Components/MaintenanceTemplateForm';
import { TemplateBuilder } from './Components/TemplateBuilder';
import { TemplateList } from './Components/TemplateList';

type ViewMode = 'viewing' | 'creating' | 'editing';

const LOCAL_STORAGE_KEY = 'maintenance_template_expanded_folders';

interface Props extends PageProps {
  templates: MaintenanceTemplate[];
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'General Settings',
    href: route('settings.machine-status.index'),
  },
  {
    title: 'Maintenance Templates',
    href: route('settings.maintenance-templates.index'),
    isCurrent: true,
  },
];

export default function MaintenanceTemplatesIndex({ templates }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<MaintenanceTemplate | null>(templates[0] || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('viewing');
  const [templateToDelete, setTemplateToDelete] = useState<MaintenanceTemplate | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isBuilderDirty, setIsBuilderDirty] = useState(false);
  const [navigationTarget, setNavigationTarget] = useState<MaintenanceTemplate | null>(null);

  // Load expanded folders from localStorage on initial render
  useEffect(() => {
    const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedState) {
      setExpandedFolders(new Set(JSON.parse(savedState)));
    }
  }, []);

  // Save expanded folders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(Array.from(expandedFolders)));
  }, [expandedFolders]);

  const handleCreateNew = () => {
    if (isBuilderDirty) {
      // We set a special null target to signify creating a new item
      setNavigationTarget({ id: 0 } as MaintenanceTemplate);
    } else {
      setSelectedTemplate(null);
      setViewMode('creating');
    }
  };

  const handleSelectTemplate = (template: MaintenanceTemplate) => {
    if (isBuilderDirty) {
      setNavigationTarget(template);
    } else {
      setSelectedTemplate(template);
      setViewMode('viewing');
    }
  };

  const confirmNavigation = () => {
    if (!navigationTarget) return;

    // If the target ID is 0, it's our signal to create a new template
    if (navigationTarget.id === 0) {
      setSelectedTemplate(null);
      setViewMode('creating');
    } else {
      setSelectedTemplate(navigationTarget);
      setViewMode('viewing');
    }

    setIsBuilderDirty(false);
    setNavigationTarget(null);
  };

  const handleEdit = (template: MaintenanceTemplate) => {
    setSelectedTemplate(template);
    setViewMode('editing');
  };

  const handleDelete = (template: MaintenanceTemplate) => {
    setTemplateToDelete(template);
  };

  const confirmDelete = () => {
    if (!templateToDelete) return;
    router.delete(route('settings.maintenance-templates.destroy', templateToDelete.id), {
      onSuccess: () => {
        setTemplateToDelete(null);
        if (selectedTemplate?.id === templateToDelete.id) {
          setSelectedTemplate(templates[0] || null);
        }
      },
    });
  };

  const groupedTemplates = useMemo(() => {
    const filtered = templates.filter((template) => template.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return filtered.reduce(
      (acc, template) => {
        const category = template.category || 'Uncategorized';
        if (!acc[category]) acc[category] = [];
        acc[category].push(template);
        return acc;
      },
      {} as Record<string, MaintenanceTemplate[]>,
    );
  }, [templates, searchTerm]);

  useEffect(() => {
    if (searchTerm) {
      setExpandedFolders(new Set(Object.keys(groupedTemplates)));
    }
  }, [searchTerm, groupedTemplates]);

  const handleToggleFolder = (category: string) => {
    setExpandedFolders((current) => {
      const newSet = new Set(current);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <GeneralSettingsLayout>
        <Head title="Maintenance Templates" />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Maintenance Templates</h1>
              <p className="text-muted-foreground">Create and manage reusable checklists for preventive maintenance tasks.</p>
            </div>
            <Button onClick={handleCreateNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <TemplateList
              groupedTemplates={groupedTemplates}
              selectedTemplate={selectedTemplate}
              viewMode={viewMode}
              searchTerm={searchTerm}
              expandedFolders={expandedFolders}
              onSearchChange={setSearchTerm}
              onSelect={handleSelectTemplate}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleFolder={handleToggleFolder}
            />

            <main className="lg:col-span-2">
              {viewMode === 'creating' || viewMode === 'editing' ? (
                <MaintenanceTemplateForm
                  template={selectedTemplate}
                  onCancel={() => {
                    setViewMode('viewing');
                    // After saving, if no template was selected before, select the first one.
                    if (!selectedTemplate) {
                      setSelectedTemplate(templates[0] || null);
                    }
                  }}
                />
              ) : selectedTemplate ? (
                <TemplateBuilder template={selectedTemplate} onDirtyChange={setIsBuilderDirty} />
              ) : (
                <div className="flex h-full min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
                  <p className="text-muted-foreground">Select a template on the left, or create a new one to get started.</p>
                </div>
              )}
            </main>
          </div>
        </div>
        <ConfirmDeleteDialog
          isOpen={!!templateToDelete}
          onOpenChange={() => setTemplateToDelete(null)}
          onConfirm={confirmDelete}
          title="Delete Template"
          description="Are you sure you want to delete this template? This action cannot be undone."
        />
        <ConfirmDeleteDialog
          isOpen={!!navigationTarget}
          onOpenChange={() => setNavigationTarget(null)}
          onConfirm={confirmNavigation}
          title="Unsaved Changes"
          description="You have unsaved changes. Are you sure you want to proceed? Your changes will be lost."
        />
      </GeneralSettingsLayout>
    </AppLayout>
  );
}
