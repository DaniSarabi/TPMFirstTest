import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Paginated } from '@/types';
import { ScheduledMaintenance } from '@/types/maintenance';

interface MaintenanceListProps {
  maintenances: Paginated<ScheduledMaintenance>;
}

export function MaintenanceList({ maintenances }: MaintenanceListProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {maintenances.data.length > 0 ? (
              maintenances.data.map((maintenance) => (
                <TableRow key={maintenance.id}>
                  <TableCell className="font-medium">{maintenance.template?.name || 'N/A'}</TableCell>
                  <TableCell>{new Date(maintenance.scheduled_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className={`capitalize ${getStatusVariant(maintenance.status)}`}>{maintenance.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No maintenance history found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {maintenances.total > 0 && <Pagination paginated={maintenances} perPageKey="maintenances_page" />}
      </CardContent>
    </Card>
  );
}
