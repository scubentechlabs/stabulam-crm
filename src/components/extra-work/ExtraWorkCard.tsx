import { format } from 'date-fns';
import { Clock, FileText, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ExtraWorkWithProfile } from '@/hooks/useExtraWork';

interface ExtraWorkCardProps {
  extraWork: ExtraWorkWithProfile;
  showEmployeeName?: boolean;
}

export function ExtraWorkCard({ extraWork, showEmployeeName }: ExtraWorkCardProps) {
  const getStatusBadge = () => {
    switch (extraWork.status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            {showEmployeeName && extraWork.profiles && (
              <div className="text-sm text-muted-foreground">
                {extraWork.profiles.full_name}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium">{extraWork.hours} Hour{extraWork.hours > 1 ? 's' : ''}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(extraWork.work_date), 'PPP')}
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Task Description */}
        <div className="rounded-lg bg-muted p-3">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Task Description</p>
              <p className="text-sm">{extraWork.task_description}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {extraWork.notes && (
          <div className="text-sm">
            <span className="text-muted-foreground">Notes: </span>
            <span>{extraWork.notes}</span>
          </div>
        )}

        {/* Admin Comments */}
        {extraWork.admin_comments && (
          <div className="rounded-lg bg-muted/50 p-3 border-l-2 border-primary">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Admin Comments</p>
                <p className="text-sm">{extraWork.admin_comments}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
