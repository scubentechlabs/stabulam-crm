import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useFlags, type Flag } from '@/hooks/useFlags';
import { FlagCard } from '@/components/flags/FlagCard';
import { FlagDetailDialog } from '@/components/flags/FlagDetailDialog';
import {
  Flag as FlagIcon,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';

export default function Flags() {
  const { user } = useAuth();
  const [selectedFlag, setSelectedFlag] = useState<Flag | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Employee only sees their own flags
  const { flags, isLoading } = useFlags({ employeeId: user?.id });

  const openFlags = flags.filter((f) => f.status === 'open');
  const acknowledgedFlags = flags.filter((f) => f.status === 'acknowledged');
  const totalReplies = flags.reduce((sum, f) => sum + (f.replies_count || 0), 0);

  const handleViewDetails = (flag: Flag) => {
    setSelectedFlag(flag);
    setShowDetail(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-destructive/10">
            <FlagIcon className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Flags</h1>
            <p className="text-sm text-muted-foreground">
              View and respond to flags issued to you
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10">
                <FlagIcon className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-8" /> : flags.length}
                </p>
                <p className="text-sm text-muted-foreground">Total Flags</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {isLoading ? (
                    <Skeleton className="h-8 w-8" />
                  ) : (
                    openFlags.length
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {isLoading ? (
                    <Skeleton className="h-8 w-8" />
                  ) : (
                    acknowledgedFlags.length
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Acknowledged</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {isLoading ? (
                    <Skeleton className="h-8 w-8" />
                  ) : (
                    totalReplies
                  )}
                </p>
                <p className="text-sm text-muted-foreground">My Responses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="border-muted bg-muted/30">
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              Flags are permanent records attached to your profile. You can submit responses to provide clarification, but cannot edit or delete flags.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Flags List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : flags.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-medium mb-1">No Flags</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Great job! You have no flags on your record.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Open Flags Section */}
          {openFlags.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Open Flags
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                  {openFlags.length}
                </Badge>
              </h2>
              <div className="space-y-3">
                {openFlags.map((flag) => (
                  <FlagCard
                    key={flag.id}
                    flag={flag}
                    onViewDetails={handleViewDetails}
                    showEmployee={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Acknowledged Flags Section */}
          {acknowledgedFlags.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Acknowledged Flags
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                  {acknowledgedFlags.length}
                </Badge>
              </h2>
              <div className="space-y-3">
                {acknowledgedFlags.map((flag) => (
                  <FlagCard
                    key={flag.id}
                    flag={flag}
                    onViewDetails={handleViewDetails}
                    showEmployee={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Dialog */}
      <FlagDetailDialog
        flag={selectedFlag}
        open={showDetail}
        onOpenChange={setShowDetail}
      />
    </div>
  );
}
