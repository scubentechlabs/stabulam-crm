import { useEffect, useState } from 'react';
import { format, parseISO, isSameDay } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Camera, Plus, Calendar as CalendarIcon, List, Loader2, Video } from 'lucide-react';
import { useShoots, type ShootWithAssignments } from '@/hooks/useShoots';
import { ShootForm } from '@/components/shoots/ShootForm';
import { ShootCard } from '@/components/shoots/ShootCard';
import { ShootCalendar } from '@/components/shoots/ShootCalendar';
import { ShootDetailDialog } from '@/components/shoots/ShootDetailDialog';
import { EditingListView } from '@/components/shoots/EditingListView';
import { cn } from '@/lib/utils';

export default function Shoots() {
  const {
    shoots,
    isLoading,
    createShoot,
    updateShootStatus,
    updateEditingStatus,
    assignToEditor,
    addAssignment,
    removeAssignment,
    deleteShoot,
  } = useShoots();

  const [activeTab, setActiveTab] = useState('calendar');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedShoot, setSelectedShoot] = useState<ShootWithAssignments | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Keep selectedShoot in sync with the latest shoots state (e.g., after member remove/add)
  useEffect(() => {
    if (!selectedShoot) return;
    const updated = shoots.find((s) => s.id === selectedShoot.id);
    if (updated) setSelectedShoot(updated);
  }, [shoots, selectedShoot?.id]);

  // Filter shoots for selected date
  const shootsForSelectedDate = shoots.filter(shoot => 
    isSameDay(parseISO(shoot.shoot_date), selectedDate)
  );

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
          <h1 className="page-title">Shoots and Editing</h1>
          <p className="page-description">Manage photo and video shoots</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Shoot
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            Shoot List View
          </TabsTrigger>
          <TabsTrigger value="editing" className="gap-2">
            <Video className="h-4 w-4" />
            Editing List View
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
                onShootClick={handleShootClick}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold">
                Shoots for {format(selectedDate, 'MMMM d, yyyy')} ({shootsForSelectedDate.length})
              </h2>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {shootsForSelectedDate.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No shoots scheduled for {format(selectedDate, 'MMMM d, yyyy')}</p>
                    <Button variant="link" onClick={() => setShowForm(true)}>
                      Create a new shoot
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {shootsForSelectedDate.map(shoot => (
                  <ShootCard
                    key={shoot.id}
                    shoot={shoot}
                    onStatusChange={updateShootStatus}
                    onEditorAssignment={assignToEditor}
                    onDelete={deleteShoot}
                    onClick={() => handleShootClick(shoot)}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="editing">
          <EditingListView
            shoots={shoots}
            onShootClick={handleShootClick}
            onEditingStatusChange={updateEditingStatus}
          />
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
    </div>
  );
}
