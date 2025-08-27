import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { EscalationPolicy } from '@/types/escalation';
import { LayoutPanelLeft, MoreHorizontal, Pencil } from 'lucide-react';

interface Props {
  policies: EscalationPolicy[];
  selectedPolicy: EscalationPolicy | null;
  onSelect: (policy: EscalationPolicy) => void;
  onEdit: (policy: EscalationPolicy) => void;
  onDelete: (policy: EscalationPolicy) => void;
  onToggleStatus: (policyId: number) => void;
}

export function PolicyList({ policies, selectedPolicy, onSelect, onEdit, onDelete, onToggleStatus }: Props) {
  return (
    <aside className="lg:col-span-1">
      <Card className="border-0 bg-primary text-primary-foreground shadow-lg drop-shadow-lg">
        <CardHeader className="border-b-3 border-background pb-2">
          <CardTitle>Existing Policies</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col">
            {policies.map((policy) => (
              <div
                key={policy.id}
                className={cn('group flex w-full items-center gap-2 border-b pr-2 text-left text-sm last:border-b-0', {
                  'bg-secondary font-semibold': selectedPolicy?.id === policy.id,
                })}
              >
                <button
                  type="button"
                  onClick={() => onSelect(policy)}
                  className="flex flex-grow items-center p-4 text-base font-bold transition-colors hover:bg-muted/50"
                >
                  <LayoutPanelLeft className="mr-3 h-4 w-4 stroke-2 text-background" />
                  {policy.name}
                </button>
                <Switch
                  className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                  checked={policy.is_active}
                  onCheckedChange={() => onToggleStatus(policy.id)}
                />
                <Button variant={'ghost'} onClick={() => onEdit(policy)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
