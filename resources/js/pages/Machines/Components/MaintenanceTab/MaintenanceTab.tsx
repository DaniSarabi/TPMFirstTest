import { CardGrid } from '@/components/card-grid';
import { Pagination } from '@/components/pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Paginated } from '@/types';
import { ScheduledMaintenance } from '@/types/maintenance';
import { router } from '@inertiajs/react';
import * as React from 'react';
import { MaintenanceCard } from './MaintenanceCard';
import { MaintenanceHistoryFilters } from './MaintenanceHistoryFilters';

// Props que el componente espera recibir
interface MaintenanceTabProps {
  machineId: number;
  allMaintenances: Paginated<ScheduledMaintenance>;
  maintenanceFilters: any;
  maintenanceFilterOptions: any;
}

export function MaintenanceTab({machineId ,allMaintenances, maintenanceFilters, maintenanceFilterOptions }: MaintenanceTabProps) {
  const [filters, setFilters] = React.useState(maintenanceFilters);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      const query = { ...filters };
      Object.keys(query).forEach((key) => (query[key] == null || query[key] === '') && delete query[key]);

      router.get(window.location.pathname, query, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [filters]);

  // ACTION: Este manejador ahora es más inteligente. Preserva los filtros de fecha al cambiar de vista.
  const handleFilterChange = (key: string, value: string | number | null) => {
    setFilters((prev: any) => {
      const newFilters = { ...prev, [key]: value };
      // Si se cambia el tipo de vista, se resetea el filtro de estado ya que puede no ser aplicable.
      if (key === 'view_type') {
        newFilters.maintenance_status = null;
      }
      return newFilters;
    });
  };

  const handleRangeFilterChange = (startKey: string, endKey: string, startValue: number | null, endValue: number | null) => {
    setFilters((prev: any) => ({
      ...prev,
      [startKey]: startValue,
      [endKey]: endValue,
    }));
  };

  const handleResetFilters = () => {
    setFilters({ view_type: filters.view_type }); // Mantiene el tipo de vista actual al resetear
  };

  return (
    <Card className="border-1 border-border bg-background shadow-lg drop-shadow-lg">
      <CardContent >
        <MaintenanceHistoryFilters
          machineId={machineId}
          filters={filters}
          options={maintenanceFilterOptions}
          onFilterChange={handleFilterChange}
          onRangeFilterChange={handleRangeFilterChange}
          onReset={handleResetFilters}
        />

        <CardGrid items={allMaintenances.data} renderCard={(maintenance) => <MaintenanceCard maintenance={maintenance as ScheduledMaintenance} />} />

        <Pagination paginated={allMaintenances} perPageKey="maintenance_per_page" />
      </CardContent>
    </Card>
  );
}
