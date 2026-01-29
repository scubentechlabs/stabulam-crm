import { useState } from 'react';
import { Camera, MapPin, Clock, Users, ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import { format, isToday, isTomorrow, addDays, startOfDay } from 'date-fns';
import { useShoots } from '@/hooks/useShoots';
import { ShootDetailDialog } from '@/components/shoots/ShootDetailDialog';

export function UpcomingShootsWidget() {
  const { shoots, isLoading } = useShoots();
  const [selectedShoot, setSelectedShoot] = useState<typeof shoots[0] | null>(null);

  // Filter shoots for today only
  const today = startOfDay(new Date());
  const todayEnd = addDays(today, 1);

  const todayShoots = shoots
    .filter(shoot => {
      const shootDate = new Date(shoot.shoot_date);
      return shootDate >= today && shootDate < todayEnd;
    })
    .sort((a, b) => new Date(a.shoot_date).getTime() - new Date(b.shoot_date).getTime());

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Today Shoots
          </CardTitle>
          <CardDescription>Your scheduled shoots for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Today Shoots
              </CardTitle>
              <CardDescription>Today's schedule</CardDescription>
            </div>
            {todayShoots.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {todayShoots.length} scheduled
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {todayShoots.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Camera className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No shoots scheduled for today</p>
              <Button variant="link" asChild className="mt-1 text-xs">
                <Link to="/shoots">View all shoots</Link>
              </Button>
            </div>
          ) : (
            <ScrollArea className="max-h-[280px]">
              <div className="space-y-3">
                {todayShoots.map((shoot) => (
                  <div
                    key={shoot.id}
                    className="group p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedShoot(shoot)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${
                              isToday(new Date(shoot.shoot_date))
                                ? 'bg-primary/10 text-primary border-primary/20'
                                : 'bg-muted'
                            }`}
                          >
                            {getDateLabel(shoot.shoot_date)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${getStatusColor(shoot.status || 'pending')}`}
                          >
                            {shoot.status?.replace('_', ' ') || 'pending'}
                          </Badge>
                        </div>
                        
                        <h4 className="font-medium text-sm truncate">{shoot.event_name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{shoot.brand_name}</p>
                        
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {shoot.shoot_time?.slice(0, 5)}
                          </span>
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{shoot.location}</span>
                          </span>
                          {shoot.assignments && shoot.assignments.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {shoot.assignments.length}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          
          {todayShoots.length > 0 && (
            <Button variant="ghost" asChild className="w-full mt-3 text-sm">
              <Link to="/shoots" className="flex items-center gap-1">
                View all shoots
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {selectedShoot && (
        <ShootDetailDialog
          shoot={selectedShoot}
          open={!!selectedShoot}
          onOpenChange={(open) => !open && setSelectedShoot(null)}
        />
      )}
    </>
  );
}
