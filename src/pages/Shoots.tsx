import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Plus, Calendar as CalendarIcon, List, Loader2 } from 'lucide-react';
import { useShoots, type ShootWithAssignments } from '@/hooks/useShoots';
import { ShootForm } from '@/components/shoots/ShootForm';
import { ShootCard } from '@/components/shoots/ShootCard';
import { ShootCalendar } from '@/components/shoots/ShootCalendar';
import { ShootDetailDialog } from '@/components/shoots/ShootDetailDialog';
import { useAuth } from '@/contexts/AuthContext';

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
          <h1 className="page-title">Shoots An Editing</h1>
          <p className="page-description">Manage photo and video shoots</p>
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
            List View
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
    </div>
  );
}
