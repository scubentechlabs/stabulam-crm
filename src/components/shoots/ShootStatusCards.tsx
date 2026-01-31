import { Clock, CheckCircle2, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ShootWithAssignments } from '@/hooks/useShoots';

export type ShootStatusFilter = 'all' | 'pending' | 'completed' | 'given_by_editor';

interface ShootStatusCardsProps {
  shoots: ShootWithAssignments[];
  selectedStatus: ShootStatusFilter;
  onStatusSelect: (status: ShootStatusFilter) => void;
}

export function ShootStatusCards({ shoots, selectedStatus, onStatusSelect }: ShootStatusCardsProps) {
  const pendingCount = shoots.filter(s => s.status === 'pending' || s.status === 'in_progress').length;
  const completedCount = shoots.filter(s => s.status === 'completed').length;
  const givenByEditorCount = shoots.filter(s => s.status === 'given_by_editor').length;

  const cards = [
    {
      status: 'pending' as ShootStatusFilter,
      label: 'Pending',
      count: pendingCount,
      icon: Clock,
      bgColor: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      ringColor: 'ring-red-500',
    },
    {
      status: 'completed' as ShootStatusFilter,
      label: 'Completed',
      count: completedCount,
      icon: CheckCircle2,
      bgColor: 'bg-yellow-500',
      hoverColor: 'hover:bg-yellow-600',
      ringColor: 'ring-yellow-500',
    },
    {
      status: 'given_by_editor' as ShootStatusFilter,
      label: 'Given By Editor',
      count: givenByEditorCount,
      icon: Send,
      bgColor: 'bg-emerald-500',
      hoverColor: 'hover:bg-emerald-600',
      ringColor: 'ring-emerald-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => {
        const isSelected = selectedStatus === card.status;
        const Icon = card.icon;
        
        return (
          <Card
            key={card.status}
            className={cn(
              'cursor-pointer transition-all duration-200',
              isSelected && `ring-2 ${card.ringColor} ring-offset-2`
            )}
            onClick={() => onStatusSelect(isSelected ? 'all' : card.status)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                  <p className="text-3xl font-bold">{card.count}</p>
                </div>
                <div className={cn(
                  'p-3 rounded-full text-white',
                  card.bgColor,
                  card.hoverColor
                )}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
