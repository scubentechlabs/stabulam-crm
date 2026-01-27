import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, TrendingDown, Clock } from 'lucide-react';
import { useLeaveBalances } from '@/hooks/useLeaveBalances';

export function LeaveBalanceCard() {
  const { balances, isLoading } = useLeaveBalances();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24" />
        </CardContent>
      </Card>
    );
  }

  const balance = balances[0];
  if (!balance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leave Balance</CardTitle>
          <CardDescription>Your annual leave allocation</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No leave balance data available</p>
        </CardContent>
      </Card>
    );
  }

  const totalAvailable = balance.annual_allocation + balance.carried_forward;
  const usagePercent = totalAvailable > 0 
    ? Math.round((balance.used_leaves / totalAvailable) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Leave Balance {new Date().getFullYear()}
        </CardTitle>
        <CardDescription>Your annual leave allocation and usage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main balance display */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-primary">{balance.remaining_leaves}</p>
            <p className="text-sm text-muted-foreground">days remaining</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">of {totalAvailable} total</p>
            {balance.carried_forward > 0 && (
              <Badge variant="secondary" className="text-xs">
                +{balance.carried_forward} carried forward
              </Badge>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Progress 
            value={usagePercent} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground text-center">
            {usagePercent}% of leave used
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-sm font-medium">{balance.used_leaves}</p>
              <p className="text-xs text-muted-foreground">Used</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <div>
              <p className="text-sm font-medium">{balance.pending_leaves}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
