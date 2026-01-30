import { format } from 'date-fns';
import { Clock, Users, UserX, Camera, MapPin, ArrowRight, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatTimeIST, formatTimeOnlyIST } from '@/lib/utils';

interface AttendanceRecord {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  clock_in_time: string | null;
  clock_out_time: string | null;
  is_late: boolean;
  late_minutes: number;
}

interface LeaveRecord {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  leave_type: string;
  half_day_period?: string;
  reason?: string;
}

interface ShootRecord {
  id: string;
  event_name: string;
  brand_name: string;
  shoot_time: string;
  location: string;
  status: string;
  assignees: { user_id: string; full_name: string; avatar_url: string | null }[];
}

interface DayDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  attendance: AttendanceRecord[];
  leaves: LeaveRecord[];
  shoots: ShootRecord[];
  isLoading?: boolean;
}

export function DayDetailDialog({
  open,
  onOpenChange,
  date,
  attendance,
  leaves,
  shoots,
  isLoading,
}: DayDetailDialogProps) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const presentCount = attendance.length;
  const lateCount = attendance.filter(a => a.is_late).length;

  const formatTime = (timeStr: string | null) => formatTimeIST(timeStr);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'in_progress':
        return 'bg-info/10 text-info border-info/20';
      default:
        return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{format(date, 'EEEE, MMMM d, yyyy')}</span>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-success border-success/30">
                <Users className="h-3 w-3 mr-1" />
                {presentCount} Present
              </Badge>
              {lateCount > 0 && (
                <Badge variant="outline" className="text-warning border-warning/30">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {lateCount} Late
                </Badge>
              )}
              {leaves.length > 0 && (
                <Badge variant="outline" className="text-destructive border-destructive/30">
                  <UserX className="h-3 w-3 mr-1" />
                  {leaves.length} Leave
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* Attendance Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-success" />
                  Attendance ({presentCount})
                </h3>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/admin/attendance?date=${dateStr}`}>
                    View All <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
              
              {attendance.length > 0 ? (
                <div className="space-y-2">
                  {attendance.map(record => (
                    <div
                      key={record.user_id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={record.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {record.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{record.full_name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>In: {formatTime(record.clock_in_time)}</span>
                            {record.clock_out_time && (
                              <span>• Out: {formatTime(record.clock_out_time)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {record.is_late && (
                        <Badge variant="outline" className="text-warning border-warning/30 text-xs">
                          {record.late_minutes} min late
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No attendance records for this day
                </p>
              )}
            </div>

            <Separator />

            {/* Leaves Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <UserX className="h-4 w-4 text-destructive" />
                  On Leave ({leaves.length})
                </h3>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin/approvals">
                    View Approvals <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
              
              {leaves.length > 0 ? (
                <div className="space-y-2">
                  {leaves.map(leave => (
                    <div
                      key={leave.user_id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-destructive/5 border-destructive/20"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={leave.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-destructive/10 text-destructive">
                            {leave.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{leave.full_name}</p>
                          {leave.reason && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {leave.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {leave.leave_type.replace('_', ' ')}
                        {leave.half_day_period && ` (${leave.half_day_period === 'first_half' ? 'AM' : 'PM'})`}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No one on leave this day
                </p>
              )}
            </div>

            <Separator />

            {/* Shoots Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Camera className="h-4 w-4 text-info" />
                  Shoots ({shoots.length})
                </h3>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin/shoots">
                    View All Shoots <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
              
              {shoots.length > 0 ? (
                <div className="space-y-3">
                  {shoots.map(shoot => (
                    <div
                      key={shoot.id}
                      className="p-3 rounded-lg border bg-info/5 border-info/20"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{shoot.event_name}</p>
                          <p className="text-sm text-muted-foreground">{shoot.brand_name}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getStatusColor(shoot.status || 'pending')}`}
                        >
                          {shoot.status?.replace('_', ' ') || 'pending'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeOnlyIST(shoot.shoot_time)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {shoot.location}
                        </span>
                      </div>

                      {shoot.assignees.length > 0 && (
                        <div className="flex items-center gap-2 pt-2 border-t border-info/20">
                          <span className="text-xs text-muted-foreground">Team:</span>
                          <div className="flex -space-x-2">
                            {shoot.assignees.slice(0, 5).map(assignee => (
                              <Avatar key={assignee.user_id} className="h-6 w-6 border-2 border-background">
                                <AvatarImage src={assignee.avatar_url || undefined} />
                                <AvatarFallback className="text-[8px]">
                                  {assignee.full_name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {shoot.assignees.length > 5 && (
                              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] border-2 border-background">
                                +{shoot.assignees.length - 5}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {shoot.assignees.length} assigned
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No shoots scheduled for this day
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
