import { useState } from 'react';
import { Plus, Calendar, Trash2, Edit2, PartyPopper, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { HolidayForm } from '@/components/holidays/HolidayForm';
import { HolidayCalendarView } from '@/components/holidays/HolidayCalendarView';
import { useHolidays, Holiday } from '@/hooks/useHolidays';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminHolidays() {
  const { holidays, isLoading, deleteHoliday, isDeleting } = useHolidays();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null);

  const upcomingHolidays = holidays.filter(h => new Date(h.date) >= new Date());
  const pastHolidays = holidays.filter(h => new Date(h.date) < new Date() && !h.is_recurring);

  const handleDelete = () => {
    if (deletingHoliday) {
      deleteHoliday(deletingHoliday.id);
      setDeletingHoliday(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Holiday Management</h1>
          <p className="text-muted-foreground">
            Configure public holidays and company events
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Holiday
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{holidays.length}</p>
                <p className="text-sm text-muted-foreground">Total Holidays</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <PartyPopper className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingHolidays.length}</p>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-info/10 flex items-center justify-center">
                <Repeat className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {holidays.filter(h => h.is_recurring).length}
                </p>
                <p className="text-sm text-muted-foreground">Annual Recurring</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Calendar and Table View */}
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <HolidayCalendarView holidays={holidays} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Holidays</CardTitle>
              <CardDescription>
                Manage company holidays and public events. Sundays are automatically treated as holidays.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : holidays.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium">No holidays configured</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Add public holidays and company events to block clock-in on those days.
                  </p>
                  <Button onClick={() => setShowAddDialog(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Holiday
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Holiday Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holidays.map((holiday) => {
                      const holidayDate = new Date(holiday.date);
                      const isPast = holidayDate < new Date() && !holiday.is_recurring;
                      
                      return (
                        <TableRow key={holiday.id} className={isPast ? 'opacity-60' : ''}>
                          <TableCell className="font-medium">{holiday.name}</TableCell>
                          <TableCell>
                            {holiday.is_recurring 
                              ? format(holidayDate, 'MMMM d') + ' (every year)'
                              : format(holidayDate, 'MMMM d, yyyy')
                            }
                          </TableCell>
                          <TableCell>
                            {holiday.is_recurring ? (
                              <Badge variant="secondary" className="gap-1">
                                <Repeat className="h-3 w-3" />
                                Annual
                              </Badge>
                            ) : (
                              <Badge variant="outline">One-time</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate">
                            {holiday.description || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingHoliday(holiday)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeletingHoliday(holiday)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Holiday Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Holiday</DialogTitle>
            <DialogDescription>
              Add a new holiday to block clock-in on this date.
            </DialogDescription>
          </DialogHeader>
          <HolidayForm onSuccess={() => setShowAddDialog(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Holiday Dialog */}
      <Dialog open={!!editingHoliday} onOpenChange={() => setEditingHoliday(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Holiday</DialogTitle>
            <DialogDescription>
              Update the holiday details.
            </DialogDescription>
          </DialogHeader>
          {editingHoliday && (
            <HolidayForm 
              holiday={editingHoliday} 
              onSuccess={() => setEditingHoliday(null)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingHoliday} onOpenChange={() => setDeletingHoliday(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Holiday</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingHoliday?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
