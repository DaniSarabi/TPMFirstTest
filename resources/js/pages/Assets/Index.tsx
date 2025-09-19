import { CardGrid } from '@/components/card-grid';
import { ListToolbar } from '@/components/list-toolbar';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useCan } from '@/lib/useCan';
import { Paginated, type BreadcrumbItem, type Filter } from '@/types';
import { Asset, AssetGroup } from '@/types/asset';

import { Head, router } from '@inertiajs/react';
import { CirclePlus, Cog } from 'lucide-react';
import * as React from 'react';
import { AssetCard, AssetWithStats } from './Components/AssetCard';
import { CreateEditAssetModal } from './Components/Modals/CreateEditAssetModal';
import { ManageGroupsModal } from './Components/Modals/ManageGroupsModal';

// Definimos los props que la página recibirá desde el controlador de Laravel
interface IndexPageProps {
  assets: Paginated<Asset>;
  assetGroups: AssetGroup[];
  filters: Filter;
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Equipment',
    href: route('assets.index'),
  },
];

export default function Index({ assets, assetGroups, filters }: IndexPageProps) {
  // Estados para controlar la visibilidad de cada modal por separado
  const [isAssetModalOpen, setAssetModalOpen] = React.useState(false);
  const [isGroupsModalOpen, setGroupsModalOpen] = React.useState(false);
  const [search, setSearch] = React.useState(filters.search || '');

  const canCreate = useCan('machines.create'); // Verificación de permisos
  const isInitialMount = React.useRef(true);

  // Efecto para ejecutar la búsqueda con un pequeño retraso (debounce)
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

  // Función para recargar los datos de la página después de una acción en un modal
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

        {/* Usamos el componente reutilizable ListToolbar */}
        <ListToolbar
          onSearch={setSearch}
          createAction={
            canCreate ? (
              <div className="flex space-x-2">
                {/* Botón para gestionar grupos */}
                <Button variant="outline" onClick={() => setGroupsModalOpen(true)}>
                  <Cog className="mr-2 h-4 w-4" />
                  Manage Groups
                </Button>
                {/* Botón principal para crear un nuevo equipo */}
                <Button onClick={() => setAssetModalOpen(true)}>
                  <CirclePlus className="mr-2 h-4 w-4" />
                  Create Equipment
                </Button>
              </div>
            ) : null
          }
        />

        {/* Usamos el componente reutilizable CardGrid */}
        <CardGrid items={assets.data} renderCard={(asset) => <AssetCard asset={asset as AssetWithStats} />} gridCols={5} />

        {/* Usamos el componente reutilizable Pagination */}
        <Pagination paginated={assets} />
      </div>

      {/* Renderizamos ambos modales, listos para ser abiertos */}
      {canCreate && (
        <>
          <CreateEditAssetModal isOpen={isAssetModalOpen} onOpenChange={setAssetModalOpen} onFinish={handleFinish} assetGroups={assetGroups} />
          <ManageGroupsModal isOpen={isGroupsModalOpen} onOpenChange={setGroupsModalOpen} onFinish={handleFinish} assetGroups={assetGroups} />
        </>
      )}
    </AppLayout>
  );
}
