import { useState } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { Separator } from '@/components/ui/separator';
import { useFlags, type Flag } from '@/hooks/useFlags';
import { useFlagDetails } from '@/hooks/useFlagDetails';
import { useAuth } from '@/contexts/AuthContext';
import {
  Flag as FlagIcon,
  User,
  Calendar,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlagDetailDialogProps {
  flag: Flag | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FlagDetailDialog({ flag, open, onOpenChange }: FlagDetailDialogProps) {
  const { isAdmin, user } = useAuth();
  const { addReply, isAddingReply, updateFlagStatus } = useFlags();
  const [replyText, setReplyText] = useState('');

  const { data: flagDetails, isLoading, isFetching, error } = useFlagDetails(flag?.id || null);

  const handleSubmitReply = () => {
    if (!flag || !replyText.trim()) return;

    addReply(
      { flag_id: flag.id, reply_text: replyText.trim() },
      {
        onSuccess: () => setReplyText(''),
      }
    );
  };

  const handleAcknowledge = () => {
    if (!flag) return;
    updateFlagStatus({ flagId: flag.id, status: 'acknowledged' });
  };

  const statusColors = {
    open: 'bg-destructive/10 text-destructive border-destructive/20',
    acknowledged: 'bg-green-500/10 text-green-600 border-green-500/20',
  };

  if (!flag) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] p-0 gap-0 overflow-hidden flex flex-col" style={{ maxHeight: '85vh' }}>
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10 shrink-0">
                <FlagIcon className="h-5 w-5 text-destructive" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg leading-tight">{flag.title}</DialogTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>{format(new Date(flag.created_at), 'dd MMM yyyy, hh:mm a')}</span>
                </div>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn('capitalize shrink-0', statusColors[flag.status])}
            >
              {flag.status === 'open' ? (
                <Clock className="mr-1 h-3 w-3" />
              ) : (
                <CheckCircle2 className="mr-1 h-3 w-3" />
              )}
              {flag.status}
            </Badge>
          </div>
        </DialogHeader>

        {/* Scrollable Content - using native overflow */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--muted-foreground) / 0.4) transparent' }}>
          {/* Employee Info Card */}
          {flag.employee_profile && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border">
              <Avatar className="h-12 w-12">
                <AvatarImage src={flag.employee_profile.avatar_url || ''} />
                <AvatarFallback className="text-base">
                  {flag.employee_profile.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{flag.employee_profile.full_name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {flag.employee_profile.email}
                </p>
              </div>
            </div>
          )}

          {/* Description Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Description
            </h4>
            <div className="p-4 rounded-xl bg-muted/30 border">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{flag.description}</p>
            </div>
          </div>

          {/* Issued By */}
          {flag.issuer_profile && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
              <User className="h-4 w-4 shrink-0" />
              <span>Issued by <span className="font-medium text-foreground">{flag.issuer_profile.full_name}</span></span>
            </div>
          )}

          <Separator className="my-2" />

          {/* Responses Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Responses ({flagDetails?.replies?.length ?? flag?.replies_count ?? 0})
            </h4>

            {isLoading || isFetching ? (
              <div className="flex items-center justify-center py-10 bg-muted/20 rounded-xl border border-dashed">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading responses...</span>
              </div>
            ) : error ? (
              <div className="text-center py-10 bg-destructive/5 rounded-xl border border-dashed border-destructive/20">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-destructive/50" />
                <p className="text-sm text-destructive">Failed to load responses. Please try again.</p>
              </div>
            ) : flagDetails?.replies && flagDetails.replies.length > 0 ? (
              <div className="space-y-3">
                {flagDetails.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={cn(
                      'p-4 rounded-xl border',
                      reply.user_id === user?.id
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-muted/30'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={reply.user_profile?.avatar_url || ''} />
                        <AvatarFallback className="text-xs">
                          {reply.user_profile?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {reply.user_profile?.full_name}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {format(new Date(reply.created_at), 'dd MMM yyyy, hh:mm a')}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap pl-9">{reply.reply_text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No responses yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Be the first to respond</p>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer - Reply Input */}
        <div className="p-4 border-t bg-background shrink-0">
          <Textarea
            placeholder="Write your response..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="min-h-[80px] resize-none mb-3"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground hidden sm:block">
              Responses cannot be edited after submission
            </p>
            <div className="flex gap-2 ml-auto">
              {isAdmin && flag.status === 'open' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAcknowledge}
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  Acknowledge
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSubmitReply}
                disabled={!replyText.trim() || isAddingReply}
              >
                {isAddingReply ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-1.5 h-4 w-4" />
                )}
                Submit
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
