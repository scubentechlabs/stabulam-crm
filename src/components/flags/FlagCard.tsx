import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Flag, MessageSquare, User, Calendar, ChevronRight } from 'lucide-react';
import type { Flag as FlagType } from '@/hooks/useFlags';
import { cn } from '@/lib/utils';

interface FlagCardProps {
  flag: FlagType;
  onViewDetails: (flag: FlagType) => void;
  showEmployee?: boolean;
}

export function FlagCard({ flag, onViewDetails, showEmployee = true }: FlagCardProps) {
  const statusColors = {
    open: 'bg-destructive/10 text-destructive border-destructive/20',
    acknowledged: 'bg-muted text-muted-foreground border-muted',
  };

  return (
    <Card 
      className="group hover:shadow-md transition-all cursor-pointer border-l-4 border-l-destructive"
      onClick={() => onViewDetails(flag)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10 shrink-0">
              <Flag className="h-5 w-5 text-destructive" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base truncate">{flag.title}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{format(new Date(flag.created_at), 'dd MMM yyyy, hh:mm a')}</span>
              </div>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={cn('shrink-0 capitalize', statusColors[flag.status])}
          >
            {flag.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {flag.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showEmployee && flag.employee_profile && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={flag.employee_profile.avatar_url || ''} />
                  <AvatarFallback className="text-xs">
                    {flag.employee_profile.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {flag.employee_profile.full_name}
                </span>
              </div>
            )}

            {flag.issuer_profile && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span>by {flag.issuer_profile.full_name}</span>
              </div>
            )}

            {(flag.replies_count || 0) > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{flag.replies_count} {flag.replies_count === 1 ? 'reply' : 'replies'}</span>
              </div>
            )}
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            View Details
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
