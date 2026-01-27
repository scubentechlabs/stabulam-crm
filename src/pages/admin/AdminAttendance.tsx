import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Calendar as CalendarIcon, Download, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUsers } from '@/hooks/useUsers';
import { BulkAttendanceManager } from '@/components/attendance/BulkAttendanceManager';
import { AttendanceExportDialog } from '@/components/attendance/AttendanceExportDialog';
import type { Database } from '@/integrations/supabase/types';

type Attendance = Database['public']['Tables']['attendance']['Row'];

export default function AdminAttendance() {
  const { users } = useUsers();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceForDate(selectedDate);
  }, [selectedDate]);

  const fetchAttendanceForDate = async (date: Date) => {
    setIsLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', dateStr);

      if (error) throw error;
      setAttendanceRecords(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const attendanceByUser = useMemo(() => {
    const map = new Map<string, Attendance>();
    attendanceRecords.forEach(record => {
      map.set(record.user_id, record);
    });
    return map;
  }, [attendanceRecords]);

  const getUserName = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    return user?.full_name || 'Unknown';
  };

  const getUserAvatar = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    return user?.avatar_url || null;
  };

  const stats = useMemo(() => {
    const activeEmployees = users.filter(u => u.is_active && u.role === 'employee');
    const present = attendanceRecords.filter(r => r.clock_in_time).length;
    const late = attendanceRecords.filter(r => r.is_late).length;
    const completed = attendanceRecords.filter(r => r.clock_out_time).length;
    return {
      total: activeEmployees.length,
      present,
      absent: activeEmployees.length - present,
      late,
      completed,
    };
  }, [users, attendanceRecords]);

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Attendance Monitor</h1>
          <p className="page-description">View and manage all employee attendance</p>
        </div>
        <AttendanceExportDialog
          trigger={
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          }
        />
      </div>

      <Tabs defaultValue="bulk" className="w-full">
        <TabsList>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Bulk Management
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bulk" className="mt-6">
          <BulkAttendanceManager />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {/* Stats & Records */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats for selected date */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card className="p-4 text-center">
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </Card>
                <Card className="p-4 text-center bg-green-500/10">
                  <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                  <p className="text-xs text-muted-foreground">Present</p>
                </Card>
                <Card className="p-4 text-center bg-red-500/10">
                  <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                  <p className="text-xs text-muted-foreground">Absent</p>
                </Card>
                <Card className="p-4 text-center bg-yellow-500/10">
                  <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
                  <p className="text-xs text-muted-foreground">Late</p>
                </Card>
                <Card className="p-4 text-center bg-blue-500/10">
                  <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </Card>
              </div>

              {/* Attendance Records */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {isToday ? "Today's Attendance" : `Attendance for ${format(selectedDate, 'MMMM d, yyyy')}`}
                  </CardTitle>
                  <CardDescription>
                    {attendanceRecords.length} record(s) found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : attendanceRecords.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No attendance records for this date</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {attendanceRecords.map((record) => (
                          <div
                            key={record.id}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={getUserAvatar(record.user_id) || undefined} />
                              <AvatarFallback>
                                {getUserName(record.user_id).split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{getUserName(record.user_id)}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>
                                  In: {record.clock_in_time 
                                    ? format(new Date(record.clock_in_time), 'h:mm a') 
                                    : '-'}
                                </span>
                                <span>•</span>
                                <span>
                                  Out: {record.clock_out_time 
                                    ? format(new Date(record.clock_out_time), 'h:mm a') 
                                    : '-'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {record.is_late && (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-500/30">
                                  Late {record.late_minutes}m
                                </Badge>
                              )}
                              {record.clock_out_time ? (
                                <Badge variant="secondary">Completed</Badge>
                              ) : record.clock_in_time ? (
                                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                                  Working
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
