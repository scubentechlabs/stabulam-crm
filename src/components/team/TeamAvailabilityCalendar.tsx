import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isWeekend } from 'date-fns';
import { ChevronLeft, ChevronRight, Users, UserX, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTeamAvailability } from '@/hooks/useTeamAvailability';

export function TeamAvailabilityCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { teamMembers, isLoading, getMembersOnLeaveForDate, getAvailableMembersForDate } = useTeamAvailability(currentMonth);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get start day of week offset
  const startDay = monthStart.getDay();

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Availability
            </CardTitle>
            <CardDescription>
              View team members' leaves and availability at a glance
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[150px] text-center font-medium">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">On Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">Half Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted" />
            <span className="text-muted-foreground">Weekend</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div
              key={day}
              className={cn(
                'text-center text-sm font-medium py-2',
                (day === 'Sun' || day === 'Sat') ? 'text-muted-foreground' : ''
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startDay }).map((_, index) => (
            <div key={`empty-${index}`} className="min-h-[100px] bg-muted/20 rounded-lg" />
          ))}

          {/* Days of the month */}
          {days.map(day => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);
            const isWeekendDay = isWeekend(day);
            const onLeave = getMembersOnLeaveForDate(day);
            const available = getAvailableMembersForDate(day);

            return (
              <TooltipProvider key={day.toISOString()}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'min-h-[100px] p-2 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50',
                        !isCurrentMonth && 'opacity-50',
                        isTodayDate && 'ring-2 ring-primary',
                        isWeekendDay && 'bg-muted/30'
                      )}
                    >
                      <div className={cn(
                        'text-sm font-medium mb-2',
                        isTodayDate && 'text-primary'
                      )}>
                        {format(day, 'd')}
                      </div>

                      {!isWeekendDay && (
                        <div className="space-y-1">
                          {/* Available count */}
                          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <Users className="h-3 w-3" />
                            <span>{available.length}</span>
                          </div>

                          {/* On leave avatars */}
                          {onLeave.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {onLeave.slice(0, 3).map(member => (
                                <Avatar key={member.user_id} className="h-6 w-6 border-2 border-red-200 dark:border-red-800">
                                  <AvatarImage src={member.avatar_url || undefined} />
                                  <AvatarFallback className="text-[10px] bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                    {member.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {onLeave.length > 3 && (
                                <Badge variant="secondary" className="h-6 text-[10px] px-1">
                                  +{onLeave.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}

                          {onLeave.length === 0 && (
                            <div className="text-[10px] text-muted-foreground">All available</div>
                          )}
                        </div>
                      )}

                      {isWeekendDay && (
                        <div className="text-[10px] text-muted-foreground">Weekend</div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[250px]">
                    <div className="space-y-2">
                      <p className="font-medium">{format(day, 'EEEE, MMMM d, yyyy')}</p>
                      
                      {!isWeekendDay && (
                        <>
                          {onLeave.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-red-500 flex items-center gap-1 mb-1">
                                <UserX className="h-3 w-3" />
                                On Leave ({onLeave.length})
                              </p>
                              <div className="space-y-1">
                                {onLeave.map(member => (
                                  <div key={member.user_id} className="flex items-center gap-2 text-sm">
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage src={member.avatar_url || undefined} />
                                      <AvatarFallback className="text-[8px]">
                                        {member.full_name.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{member.full_name}</span>
                                    {member.leave_type === 'half_day' && (
                                      <Badge variant="outline" className="text-[10px] h-4">
                                        {member.half_day_period === 'first_half' ? 'AM' : 'PM'}
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <p className="text-sm font-medium text-green-500 flex items-center gap-1 mb-1">
                              <Users className="h-3 w-3" />
                              Available ({available.length})
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {available.slice(0, 5).map(member => (
                                <Avatar key={member.user_id} className="h-5 w-5">
                                  <AvatarImage src={member.avatar_url || undefined} />
                                  <AvatarFallback className="text-[8px]">
                                    {member.full_name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {available.length > 5 && (
                                <span className="text-xs text-muted-foreground">
                                  +{available.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {isWeekendDay && (
                        <p className="text-sm text-muted-foreground">Weekend - Office Closed</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

        {/* Team Summary */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-medium mb-3">Team Members ({teamMembers.length})</h3>
          <div className="flex flex-wrap gap-2">
            {teamMembers.map(member => (
              <div
                key={member.user_id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {member.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{member.full_name}</span>
                {member.department && (
                  <Badge variant="outline" className="text-[10px]">
                    {member.department}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
