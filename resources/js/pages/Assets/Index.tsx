import { CardGrid } from '@/components/card-grid';
import { ListToolbar } from '@/components/list-toolbar';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useCan } from '@/lib/useCan';
import { BreadcrumbItem, Filter, Paginated } from '@/types';
import { Asset, AssetGroup } from '@/types/asset';
import { Machine } from '@/types/machine';
import { Head, router } from '@inertiajs/react';
import { CirclePlus, FolderKanban } from 'lucide-react';
import * as React from 'react';
import { AssetCard } from './Components/AssetCard';
import { AssetGroupCard } from './Components/AssetGroupCard';
import { CreateEditAssetModal } from './Components/Modals/CreateEditAssetModal';
import { ManageGroupsModal } from './Components/Modals/ManageGroupsModal';

interface IndexPageProps {
  assetGroups: (AssetGroup & { assets: Asset[]; machines: Machine[] })[]; // Grupos para las tarjetas interactivas
  individualAssets: Paginated<Asset & { pending_maintenances_count: number }>; // Equipos individuales paginados
  allAssetGroups: AssetGroup[]; // Lista completa de grupos para los modales
  filters: Filter;
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Equipment',
    href: route('assets.index'),
  },
];

export default function Index({ assetGroups, individualAssets, allAssetGroups, filters }: IndexPageProps) {
  const [createEditModalOpen, setCreateEditModalOpen] = React.useState(false);
  const [manageGroupsModalOpen, setManageGroupsModalOpen] = React.useState(false);
  const [search, setSearch] = React.useState(filters.search || '');

  const canCreate = useCan('machines.create');
  const isInitialMount = React.useRef(true);

  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      router.get(route('assets.index'), { search }, { preserveState: true, replace: true });
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const combinedItems = React.useMemo(() => {
    const groups = assetGroups.map((group) => ({ ...group, type: 'group', id: `group-${group.id}` }));
    const individuals = individualAssets.data.map((asset) => ({ ...asset, type: 'asset' }));
    return [...groups, ...individuals];
  }, [assetGroups, individualAssets.data]);

  function handleFinish() {
    router.reload({ only: ['assets', 'assetGroups'] });
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Equipment" />
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Equipment Management</h1>
        </div>

        <ListToolbar onSearch={setSearch} searchPlaceholder="Search by equipment or group name...">
          {canCreate && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setManageGroupsModalOpen(true)}>
                <FolderKanban className="mr-2 h-4 w-4" />
                Manage Groups
              </Button>
              <Button onClick={() => setCreateEditModalOpen(true)}>
                <CirclePlus className="mr-2 h-4 w-4" />
                Create Equipment
              </Button>
            </div>
          )}
        </ListToolbar>

        <CardGrid
          gridCols={5}
          items={combinedItems}
          renderCard={(item) => {
            if (item.type === 'group') {
              // FIX: Le decimos a TypeScript que primero trate el objeto como 'unknown'
              // para resolver la ambigüedad del tipo unión. Esto soluciona el segundo error.
              return <AssetGroupCard group={item as unknown as AssetGroup & { assets: Asset[]; machines: Machine[] }} />;
            }
            return <AssetCard asset={item as Asset & { pending_maintenances_count: number }} />;
          }}
        />

        {/* La paginación solo aplica a los equipos individuales */}
        <Pagination paginated={individualAssets} />
      </div>

      {canCreate && (
        <>
          <CreateEditAssetModal
            isOpen={createEditModalOpen}
            onOpenChange={setCreateEditModalOpen}
            onFinish={handleFinish}
            assetGroups={allAssetGroups}
          />
          <ManageGroupsModal
            isOpen={manageGroupsModalOpen}
            onOpenChange={setManageGroupsModalOpen}
            onFinish={handleFinish}
            assetGroups={allAssetGroups}
          />
        </>
      )}
    </AppLayout>
  );
}
