import { useState, useEffect } from 'react';
import { Plus, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useWorkCalendarTasks, WorkCalendarTask } from '@/hooks/useWorkCalendarTasks';
import { WorkCalendarView } from '@/components/work-calendar/WorkCalendarView';
import { TaskDayDetail } from '@/components/work-calendar/TaskDayDetail';
import { AdminTaskDialog } from '@/components/work-calendar/AdminTaskDialog';

interface UserProfile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

export default function EmployeeWorkCalendar() {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkCalendarTask | null>(null);

  const { 
    tasks, 
    tasksByDate, 
    isLoading, 
    isSubmitting,
    createTask,
    updateTask,
  } = useWorkCalendarTasks(selectedUserId || undefined, currentMonth);

  // Fetch users list
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .eq('is_active', true)
          .order('full_name');

        if (error) throw error;
        setUsers(data || []);
        
        // Set default selection to current user for non-admins
        if (!isAdmin && user) {
          setSelectedUserId(user.id);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [user, isAdmin]);

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId === 'all' ? '' : userId);
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsTaskDialogOpen(true);
  };

  const handleEditTask = (task: WorkCalendarTask) => {
    setEditingTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleTaskSubmit = async (data: {
    title: string;
    description: string | null;
    taskType: 'tod' | 'eod' | 'utod' | 'urgent_tod';
    assignedUserId: string;
    taskDate: Date;
  }): Promise<boolean> => {
    if (editingTask) {
      const result = await updateTask(editingTask.id, {
        title: data.title,
        description: data.description,
        task_type: data.taskType,
      });
      return !!result;
    } else {
      const result = await createTask(
        data.title,
        data.description,
        data.taskType,
        data.assignedUserId,
        data.taskDate
      );
      return !!result;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Employee Work Calendar</h1>
            <p className="page-description">
              {isAdmin 
                ? 'View and manage employee tasks across the calendar'
                : 'View your tasks across the calendar'
              }
            </p>
          </div>

          {isAdmin && (
            <Button onClick={handleCreateTask}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Select 
            value={selectedUserId || 'all'} 
            onValueChange={handleUserChange}
            disabled={!isAdmin && !!user}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {isAdmin && (
                <SelectItem value="all">All Employees</SelectItem>
              )}
              {users.map(u => (
                <SelectItem key={u.user_id} value={u.user_id}>
                  {u.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading tasks...</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <WorkCalendarView
            tasksByDate={tasksByDate}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />
        </div>

        {/* Day Detail Panel */}
        <div className="lg:col-span-1">
          <TaskDayDetail
            selectedDate={selectedDate}
            tasks={tasks}
            isAdmin={isAdmin}
            onEditTask={handleEditTask}
          />
        </div>
      </div>

      {/* Admin Task Dialog */}
      {isAdmin && (
        <AdminTaskDialog
          open={isTaskDialogOpen}
          onOpenChange={setIsTaskDialogOpen}
          users={users}
          selectedDate={selectedDate}
          editingTask={editingTask}
          onSubmit={handleTaskSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
