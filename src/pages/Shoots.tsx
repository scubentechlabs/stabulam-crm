import { useState } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Plus, Calendar as CalendarIcon, List, Loader2, X } from 'lucide-react';
import { useShoots, type ShootWithAssignments } from '@/hooks/useShoots';
import { ShootForm } from '@/components/shoots/ShootForm';
import { ShootCard } from '@/components/shoots/ShootCard';
import { ShootCalendar } from '@/components/shoots/ShootCalendar';
import { ShootDetailDialog } from '@/components/shoots/ShootDetailDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

export default function Shoots() {
  const { isAdmin } = useAuth();
  const {
    shoots,
    myAssignedShoots,
    upcomingShoots,
    isLoading,
    createShoot,
    updateShootStatus,
    addAssignment,
    removeAssignment,
    deleteShoot,
  } = useShoots();

  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedShoot, setSelectedShoot] = useState<ShootWithAssignments | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showDateShoots, setShowDateShoots] = useState(true);

  const shootsForSelectedDate = selectedDate
    ? shoots.filter(shoot => isSameDay(parseISO(shoot.shoot_date), selectedDate))
    : [];

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowDateShoots(true);
  };

  const handleCreateShoot = async (data: Parameters<typeof createShoot>[0]) => {
    setIsSubmitting(true);
    await createShoot(data);
    setIsSubmitting(false);
  };

  const handleShootClick = (shoot: ShootWithAssignments) => {
    setSelectedShoot(shoot);
    setShowDetail(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Shoot An Editing</h1>
          <p className="page-description">Manage photo and video shoots & editing</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Shoot
        </Button>
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            Shoot List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Shoot Calendar
              </CardTitle>
              <CardDescription>View all scheduled shoots by month</CardDescription>
            </CardHeader>
            <CardContent>
              <ShootCalendar
                shoots={shoots}
                onDateClick={handleDateClick}
                onShootClick={handleShootClick}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Upcoming Shoots ({upcomingShoots.length})</h2>
            </div>

            {upcomingShoots.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No upcoming shoots scheduled</p>
                    <Button variant="link" onClick={() => setShowForm(true)}>
                      Create your first shoot
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingShoots.map(shoot => (
                  <ShootCard
                    key={shoot.id}
                    shoot={shoot}
                    onStatusChange={updateShootStatus}
                    onDelete={deleteShoot}
                    onClick={() => handleShootClick(shoot)}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ShootForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleCreateShoot}
        isSubmitting={isSubmitting}
      />

      <ShootDetailDialog
        shoot={selectedShoot}
        open={showDetail}
        onOpenChange={setShowDetail}
        onStatusChange={updateShootStatus}
        onAddAssignment={addAssignment}
        onRemoveAssignment={removeAssignment}
      />

      {/* Date Shoots Dialog */}
      <Dialog open={showDateShoots} onOpenChange={setShowDateShoots}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Shoots on {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}
            </DialogTitle>
          </DialogHeader>
          
          {shootsForSelectedDate.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No shoots scheduled for this date</p>
              <Button 
                variant="link" 
                onClick={() => {
                  setShowDateShoots(false);
                  setShowForm(true);
                }}
              >
                Create a new shoot
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {shootsForSelectedDate.map(shoot => (
                <div
                  key={shoot.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setShowDateShoots(false);
                    handleShootClick(shoot);
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{shoot.event_name}</h4>
                      <p className="text-sm text-muted-foreground truncate">{shoot.brand_name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {shoot.shoot_time} • {shoot.location}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        shoot.status === 'completed' 
                          ? 'secondary' 
                          : shoot.status === 'in_progress' 
                          ? 'default' 
                          : 'outline'
                      }
                    >
                      {shoot.status === 'in_progress' ? 'In Progress' : shoot.status}
                    </Badge>
                  </div>
                  {shoot.assignments.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <span>Team:</span>
                      {shoot.assignments.slice(0, 3).map((a, i) => (
                        <Badge key={a.id} variant="outline" className="text-xs">
                          {a.profile?.full_name || 'Unknown'}
                        </Badge>
                      ))}
                      {shoot.assignments.length > 3 && (
                        <span>+{shoot.assignments.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
