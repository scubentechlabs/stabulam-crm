import { format, parseISO } from 'date-fns';
import { 
  ArrowRight,
  ArrowRightFromLine,
  Eye,
  LogOut,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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

export function AttendanceTableView({ data, isLoading }: AttendanceTableViewProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="space-y-4 p-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-8" />
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
            <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No attendance records found</p>
            <p className="text-sm">Try adjusting your filters or date range</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <ScrollArea className="h-[600px]">
        <Table>
          <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10">
            <TableRow className="border-b-2 border-slate-200 dark:border-slate-700">
              <TableHead className="w-[60px] text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">SR NO</TableHead>
              <TableHead className="w-[70px] text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Selfie</TableHead>
              <TableHead className="w-[140px] text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Employee</TableHead>
              <TableHead className="w-[100px] text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Date</TableHead>
              <TableHead className="w-[100px] text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Clock In</TableHead>
              <TableHead className="w-[100px] text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Clock Out</TableHead>
              <TableHead className="w-[100px] text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Work Hours</TableHead>
              <TableHead className="w-[140px] text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</TableHead>
              <TableHead className="w-[100px] text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => {
              const isLate = row.is_late && row.late_minutes && row.late_minutes > 0;
              const isWorking = row.status === 'working';
              const isCompleted = row.status === 'completed';
              const isAbsent = row.status === 'absent';
              const isAutoClockOut = row.clock_out_time && row.work_hours && parseFloat(row.work_hours.replace('h', '').replace('m', '')) > 10;
              
              return (
                <TableRow 
                  key={row.id}
                  className={cn(
                    'transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50',
                    index % 2 === 1 && 'bg-slate-25 dark:bg-slate-900/30'
                  )}
                >
                  {/* SR NO */}
                  <TableCell className="font-medium text-slate-600 dark:text-slate-400">
                    {index + 1}
                  </TableCell>

                  {/* SELFIE */}
                  <TableCell>
                    <Avatar className="h-10 w-10 border-2 border-slate-200 dark:border-slate-700">
                      <AvatarImage src={row.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-slate-100 dark:bg-slate-800">
                        {row.user_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>

                  {/* EMPLOYEE */}
                  <TableCell>
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 uppercase">
                      {row.user_name}
                    </span>
                  </TableCell>

                  {/* DATE */}
                  <TableCell>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {format(parseISO(row.date), 'MMM dd, yyyy')}
                    </span>
                  </TableCell>

                  {/* CLOCK IN */}
                  <TableCell>
                    {row.clock_in_time ? (
                      <div className="flex items-center gap-1.5">
                        <ArrowRight className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {formatTimeIST(row.clock_in_time)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </TableCell>

                  {/* CLOCK OUT */}
                  <TableCell>
                    {row.clock_out_time ? (
                      <div className="flex items-center gap-1.5">
                        <ArrowRightFromLine className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {formatTimeIST(row.clock_out_time)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </TableCell>

                  {/* WORK HOURS */}
                  <TableCell>
                    {row.work_hours ? (
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {row.work_hours.replace('h ', '.').replace('m', ' hrs')}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </TableCell>

                  {/* STATUS */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {/* Main status badge */}
                      {isAbsent ? (
                        <Badge className="bg-red-500 text-white border-0 text-xs font-medium w-fit">
                          Absent
                        </Badge>
                      ) : isCompleted ? (
                        isAutoClockOut ? (
                          <Badge className="bg-green-500 text-white border-0 text-xs font-medium w-fit">
                            Auto Clock Out
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-700 text-white border-0 text-xs font-medium w-fit">
                            Completed
                          </Badge>
                        )
                      ) : isWorking ? (
                        <Badge className="bg-slate-700 text-white border-0 text-xs font-medium w-fit">
                          In Progress
                        </Badge>
                      ) : null}
                      
                      {/* Late badge */}
                      {isLate && row.late_minutes && (
                        <Badge className="bg-red-500 text-white border-0 text-xs font-medium w-fit">
                          Late ({row.late_minutes}m)
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* ACTIONS */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {isWorking && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      )}
                      {isAutoClockOut && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-orange-500 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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
