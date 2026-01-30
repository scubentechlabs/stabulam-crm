import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  PlayCircle, 
  Clock, 
  Eye, 
  Send, 
  RotateCcw, 
  CheckCircle2, 
  Video,
  MapPin,
  Calendar,
  User,
  ExternalLink
} from 'lucide-react';
import type { ShootWithAssignments } from '@/hooks/useShoots';
import { cn } from '@/lib/utils';

interface EditingListViewProps {
  shoots: ShootWithAssignments[];
  onShootClick: (shoot: ShootWithAssignments) => void;
}

type EditingStatus = 'not_started' | 'editing' | 'internal_review' | 'sent_to_client' | 'revisions_round' | 'final_delivered';

const editingStatusConfig: Record<EditingStatus, { label: string; icon: React.ElementType; color: string }> = {
  not_started: { label: 'Not Started', icon: Clock, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  editing: { label: 'Editing', icon: PlayCircle, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  internal_review: { label: 'Internal Review', icon: Eye, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  sent_to_client: { label: 'Sent to Client', icon: Send, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  revisions_round: { label: 'Revisions Round', icon: RotateCcw, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  final_delivered: { label: 'Final Delivered', icon: CheckCircle2, color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
};

const statusOrder: EditingStatus[] = ['not_started', 'editing', 'internal_review', 'sent_to_client', 'revisions_round', 'final_delivered'];

export function EditingListView({ shoots, onShootClick }: EditingListViewProps) {
  const [activeStatus, setActiveStatus] = useState<EditingStatus>('not_started');

  // Filter shoots by editing status
  const getShootsByStatus = (status: EditingStatus) => {
    return shoots.filter(shoot => (shoot.editing_status || 'not_started') === status);
  };

  const getStatusCount = (status: EditingStatus) => {
    return getShootsByStatus(status).length;
  };

  const filteredShoots = getShootsByStatus(activeStatus);
  const StatusIcon = editingStatusConfig[activeStatus].icon;

  return (
    <div className="space-y-4">
      {/* Status Tabs */}
      <Tabs value={activeStatus} onValueChange={(v) => setActiveStatus(v as EditingStatus)}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
          {statusOrder.map((status) => {
            const config = editingStatusConfig[status];
            const Icon = config.icon;
            const count = getStatusCount(status);
            
            return (
              <TabsTrigger
                key={status}
                value={status}
                className={cn(
                  "gap-2 data-[state=active]:shadow-sm border",
                  activeStatus === status ? config.color : "bg-muted/50"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{config.label}</span>
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {statusOrder.map((status) => (
          <TabsContent key={status} value={status} className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <StatusIcon className="h-5 w-5" />
                  {editingStatusConfig[status].label}
                  <Badge variant="outline" className="ml-2">
                    {getStatusCount(status)} shoots
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getShootsByStatus(status).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No shoots in "{editingStatusConfig[status].label}" status</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event / Brand</TableHead>
                          <TableHead>Shoot Date</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Editor</TableHead>
                          <TableHead>Deadline</TableHead>
                          <TableHead>Drive Link</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getShootsByStatus(status).map((shoot) => (
                          <TableRow 
                            key={shoot.id} 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => onShootClick(shoot)}
                          >
                            <TableCell>
                              <div>
                                <p className="font-medium">{shoot.event_name}</p>
                                <p className="text-sm text-muted-foreground">{shoot.brand_name}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{format(parseISO(shoot.shoot_date), 'MMM d, yyyy')}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate max-w-[150px]">{shoot.location}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {shoot.assigned_editor ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={shoot.assigned_editor.avatar_url || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {shoot.assigned_editor.full_name?.charAt(0) || 'E'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm truncate max-w-[100px]">
                                    {shoot.assigned_editor.full_name}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">Not assigned</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {shoot.editor_deadline ? (
                                <span className="text-sm">
                                  {format(parseISO(shoot.editor_deadline), 'MMM d, yyyy')}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {shoot.editor_drive_link ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(shoot.editor_drive_link!, '_blank');
                                  }}
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Open
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onShootClick(shoot);
                                }}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
