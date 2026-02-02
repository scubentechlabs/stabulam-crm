import { format, parseISO } from 'date-fns';
import { 
  Clock, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Calendar,
  User,
  Timer,
  FileText,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AttendanceSelfieAvatar } from './AttendanceSelfieAvatar';
import { formatTimeIST } from '@/lib/utils';
import type { AttendanceTableRow } from '@/hooks/useAttendanceTable';

interface AttendanceDetailDialogProps {
  record: AttendanceTableRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AttendanceDetailDialog({ 
  record, 
  open, 
  onOpenChange 
}: AttendanceDetailDialogProps) {
  if (!record) return null;

  const isLate = record.is_late && record.late_minutes && record.late_minutes > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Attendance Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Employee Info */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <AttendanceSelfieAvatar
              clockInPhotoUrl={record.clock_in_photo_url}
              avatarUrl={record.avatar_url}
              userName={record.user_name}
            />
            <div>
              <h3 className="font-semibold text-lg">{record.user_name}</h3>
              {record.department && (
                <p className="text-sm text-muted-foreground">{record.department}</p>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">
                {format(parseISO(record.date), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </div>

          <Separator />

          {/* Time Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Clock In</p>
                <p className="font-medium">
                  {record.clock_in_time ? formatTimeIST(record.clock_in_time) : '-'}
                </p>
                {isLate && (
                  <Badge variant="outline" className="mt-1 text-xs bg-red-50 text-red-600 border-red-200">
                    Late by {record.late_minutes}m
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Clock Out</p>
                <p className="font-medium">
                  {record.clock_out_time ? formatTimeIST(record.clock_out_time) : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Work Hours */}
          {record.work_hours && (
            <>
              <Separator />
              <div className="flex items-center gap-3">
                <Timer className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Work Hours</p>
                  <p className="font-medium text-lg">{record.work_hours}</p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* TOD & EOD Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">TOD Status</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {record.tod_submitted ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Submitted</span>
                    </>
                  ) : record.clock_in_time ? (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">Not Submitted</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">EOD Status</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {record.eod_submitted ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Submitted</span>
                    </>
                  ) : record.clock_in_time ? (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">Not Submitted</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            {record.status === 'absent' ? (
              <Badge className="bg-red-500 text-white">Absent</Badge>
            ) : record.status === 'completed' ? (
              <Badge className="bg-green-600 text-white">Completed</Badge>
            ) : record.status === 'working' ? (
              <Badge className="bg-blue-600 text-white">In Progress</Badge>
            ) : record.status === 'late' ? (
              <Badge className="bg-amber-500 text-white">Late</Badge>
            ) : (
              <Badge className="bg-slate-600 text-white">Present</Badge>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
