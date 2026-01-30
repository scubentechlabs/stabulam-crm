import { format, parseISO } from 'date-fns';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
  CalendarCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, formatTimeIST } from '@/lib/utils';
import type { AttendanceTableRow } from '@/hooks/useAttendanceTable';

interface AttendanceTableViewProps {
  data: AttendanceTableRow[];
  isLoading: boolean;
}

const statusConfig = {
  present: {
    label: 'Present',
    icon: CheckCircle2,
    className: 'bg-green-500/10 text-green-600 border-green-500/20',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  working: {
    label: 'Working',
    icon: Timer,
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  late: {
    label: 'Late',
    icon: AlertTriangle,
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  absent: {
    label: 'Absent',
    icon: XCircle,
    className: 'bg-red-500/10 text-red-600 border-red-500/20',
  },
};

export function AttendanceTableView({ data, isLoading }: AttendanceTableViewProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="space-y-4 p-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24 ml-auto" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No attendance records found</p>
            <p className="text-sm">Try adjusting your filters or date range</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <ScrollArea className="h-[600px]">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10">
            <TableRow>
              <TableHead className="w-[250px]">Employee</TableHead>
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead className="w-[100px]">Clock In</TableHead>
              <TableHead className="w-[100px]">Clock Out</TableHead>
              <TableHead className="w-[100px]">Work Hours</TableHead>
              <TableHead className="w-[80px] text-center">TOD</TableHead>
              <TableHead className="w-[80px] text-center">EOD</TableHead>
              <TableHead className="w-[120px] text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => {
              const config = statusConfig[row.status];
              const StatusIcon = config.icon;
              
              return (
                <TableRow 
                  key={row.id}
                  className={cn(
                    'transition-colors',
                    row.status === 'absent' && 'bg-red-500/5'
                  )}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={row.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {row.user_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{row.user_name}</p>
                        {row.department && (
                          <p className="text-xs text-muted-foreground">{row.department}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{format(parseISO(row.date), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(row.date), 'EEEE')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.clock_in_time ? (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {formatTimeIST(row.clock_in_time)}
                        </span>
                        {row.is_late && row.late_minutes && (
                          <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 h-5 text-amber-600 border-amber-500/30">
                            +{row.late_minutes}m
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.clock_out_time ? (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {formatTimeIST(row.clock_out_time)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.work_hours ? (
                      <span className="text-sm font-medium">{row.work_hours}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.tod_submitted ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                    ) : row.clock_in_time ? (
                      <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.eod_submitted ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                    ) : row.clock_in_time ? (
                      <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge 
                      variant="outline" 
                      className={cn('gap-1', config.className)}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </Card>
  );
}
