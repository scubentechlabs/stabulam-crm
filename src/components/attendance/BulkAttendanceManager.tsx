import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Clock, LogIn, LogOut, Users, CheckCircle2, XCircle, Loader2, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUsers, type UserWithRole } from '@/hooks/useUsers';
import { useBulkAttendance } from '@/hooks/useBulkAttendance';

type AttendanceStatus = 'not_clocked_in' | 'clocked_in' | 'clocked_out';

interface EmployeeWithStatus extends UserWithRole {
  attendanceStatus: AttendanceStatus;
}

export function BulkAttendanceManager() {
  const { users, isLoading: isLoadingUsers } = useUsers();
  const {
    isProcessing,
    isLoading: isLoadingAttendance,
    bulkClockIn,
    bulkClockOut,
    fetchTodayAttendance,
    getAttendanceStatus,
  } = useBulkAttendance();

  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showClockInDialog, setShowClockInDialog] = useState(false);
  const [showClockOutDialog, setShowClockOutDialog] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchTodayAttendance();
  }, [fetchTodayAttendance]);

  const activeEmployees = useMemo(() => {
    return users.filter(u => u.is_active && u.role === 'employee');
  }, [users]);

  const employeesWithStatus: EmployeeWithStatus[] = useMemo(() => {
    return activeEmployees.map(user => ({
      ...user,
      attendanceStatus: getAttendanceStatus(user.user_id),
    }));
  }, [activeEmployees, getAttendanceStatus]);

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employeesWithStatus;
    const query = searchQuery.toLowerCase();
    return employeesWithStatus.filter(
      emp =>
        emp.full_name.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.department?.toLowerCase().includes(query)
    );
  }, [employeesWithStatus, searchQuery]);

  const stats = useMemo(() => {
    const notClockedIn = employeesWithStatus.filter(e => e.attendanceStatus === 'not_clocked_in').length;
    const clockedIn = employeesWithStatus.filter(e => e.attendanceStatus === 'clocked_in').length;
    const clockedOut = employeesWithStatus.filter(e => e.attendanceStatus === 'clocked_out').length;
    return { notClockedIn, clockedIn, clockedOut, total: employeesWithStatus.length };
  }, [employeesWithStatus]);

  const selectedEmployees = useMemo(() => {
    return employeesWithStatus.filter(e => selectedUserIds.has(e.user_id));
  }, [employeesWithStatus, selectedUserIds]);

  const canClockInSelected = useMemo(() => {
    return selectedEmployees.some(e => e.attendanceStatus === 'not_clocked_in');
  }, [selectedEmployees]);

  const canClockOutSelected = useMemo(() => {
    return selectedEmployees.some(e => e.attendanceStatus === 'clocked_in');
  }, [selectedEmployees]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(new Set(filteredEmployees.map(e => e.user_id)));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const handleSelectEmployee = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUserIds);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleBulkClockIn = async () => {
    const eligibleIds = selectedEmployees
      .filter(e => e.attendanceStatus === 'not_clocked_in')
      .map(e => e.user_id);
    
    if (eligibleIds.length > 0) {
      await bulkClockIn(eligibleIds, notes);
      setShowClockInDialog(false);
      setNotes('');
      setSelectedUserIds(new Set());
    }
  };

  const handleBulkClockOut = async () => {
    const eligibleIds = selectedEmployees
      .filter(e => e.attendanceStatus === 'clocked_in')
      .map(e => e.user_id);
    
    if (eligibleIds.length > 0) {
      await bulkClockOut(eligibleIds, notes);
      setShowClockOutDialog(false);
      setNotes('');
      setSelectedUserIds(new Set());
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'not_clocked_in':
        return <Badge variant="outline" className="text-muted-foreground">Not Clocked In</Badge>;
      case 'clocked_in':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Working</Badge>;
      case 'clocked_out':
        return <Badge variant="secondary">Completed</Badge>;
    }
  };

  const isLoading = isLoadingUsers || isLoadingAttendance;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Bulk Attendance Management
              </CardTitle>
              <CardDescription>
                Clock in/out multiple employees at once • {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Employees</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/10 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.notClockedIn}</p>
              <p className="text-xs text-muted-foreground">Not Clocked In</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.clockedIn}</p>
              <p className="text-xs text-muted-foreground">Currently Working</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.clockedOut}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowClockInDialog(true)}
                disabled={!canClockInSelected || selectedUserIds.size === 0}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Clock In ({selectedEmployees.filter(e => e.attendanceStatus === 'not_clocked_in').length})
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowClockOutDialog(true)}
                disabled={!canClockOutSelected || selectedUserIds.size === 0}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Clock Out ({selectedEmployees.filter(e => e.attendanceStatus === 'clocked_in').length})
              </Button>
            </div>
          </div>

          {/* Employee List */}
          <div className="border rounded-lg">
            {/* Header */}
            <div className="flex items-center gap-3 p-3 border-b bg-muted/30">
              <Checkbox
                checked={selectedUserIds.size === filteredEmployees.length && filteredEmployees.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">
                {selectedUserIds.size > 0 
                  ? `${selectedUserIds.size} selected` 
                  : 'Select all employees'}
              </span>
            </div>

            {/* List */}
            <ScrollArea className="h-[400px]">
              {filteredEmployees.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No employees found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredEmployees.map((employee) => (
                    <div
                      key={employee.user_id}
                      className={`flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors ${
                        selectedUserIds.has(employee.user_id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      <Checkbox
                        checked={selectedUserIds.has(employee.user_id)}
                        onCheckedChange={(checked) => 
                          handleSelectEmployee(employee.user_id, checked as boolean)
                        }
                      />
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={employee.avatar_url || undefined} />
                        <AvatarFallback>
                          {employee.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{employee.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {employee.department || 'No department'} • {employee.email}
                        </p>
                      </div>
                      {getStatusBadge(employee.attendanceStatus)}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Clock In Dialog */}
      <Dialog open={showClockInDialog} onOpenChange={setShowClockInDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-green-600" />
              Bulk Clock In
            </DialogTitle>
            <DialogDescription>
              Clock in {selectedEmployees.filter(e => e.attendanceStatus === 'not_clocked_in').length} employee(s) at {format(new Date(), 'h:mm a')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-32 overflow-y-auto space-y-1">
              {selectedEmployees
                .filter(e => e.attendanceStatus === 'not_clocked_in')
                .map(emp => (
                  <div key={emp.user_id} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>{emp.full_name}</span>
                  </div>
                ))}
            </div>
            <Textarea
              placeholder="Optional notes (e.g., 'Team meeting attendance')"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClockInDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkClockIn} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Clock In All
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clock Out Dialog */}
      <Dialog open={showClockOutDialog} onOpenChange={setShowClockOutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-blue-600" />
              Bulk Clock Out
            </DialogTitle>
            <DialogDescription>
              Clock out {selectedEmployees.filter(e => e.attendanceStatus === 'clocked_in').length} employee(s) at {format(new Date(), 'h:mm a')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-32 overflow-y-auto space-y-1">
              {selectedEmployees
                .filter(e => e.attendanceStatus === 'clocked_in')
                .map(emp => (
                  <div key={emp.user_id} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>{emp.full_name}</span>
                  </div>
                ))}
            </div>
            <Textarea
              placeholder="Optional notes (e.g., 'End of shift')"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClockOutDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkClockOut} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Clock Out All
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
