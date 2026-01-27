import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Edit2, Calendar, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { useLeaveBalances, LeaveBalanceWithProfile } from '@/hooks/useLeaveBalances';

export function LeaveBalanceManager() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const { balances, isLoading, updateAllocation, syncAllBalances } = useLeaveBalances(selectedYear);
  const [editingEmployee, setEditingEmployee] = useState<LeaveBalanceWithProfile | null>(null);
  const [newAllocation, setNewAllocation] = useState('18');
  const [newCarriedForward, setNewCarriedForward] = useState('0');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleSync = async () => {
    setIsSyncing(true);
    await syncAllBalances();
    setIsSyncing(false);
  };

  const handleEditClick = (employee: LeaveBalanceWithProfile) => {
    setEditingEmployee(employee);
    setNewAllocation(employee.annual_allocation.toString());
    setNewCarriedForward(employee.carried_forward.toString());
  };

  const handleSaveAllocation = async () => {
    if (!editingEmployee) return;
    
    setIsSaving(true);
    await updateAllocation(
      editingEmployee.user_id,
      parseFloat(newAllocation) || 18,
      parseFloat(newCarriedForward) || 0
    );
    setIsSaving(false);
    setEditingEmployee(null);
  };

  // Summary stats
  const totalAllocation = balances.reduce((sum, b) => sum + b.annual_allocation + b.carried_forward, 0);
  const totalUsed = balances.reduce((sum, b) => sum + b.used_leaves, 0);
  const totalPending = balances.reduce((sum, b) => sum + b.pending_leaves, 0);
  const totalRemaining = balances.reduce((sum, b) => sum + b.remaining_leaves, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with year selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Leave Balance Management</h2>
          <p className="text-muted-foreground">
            Track and manage employee leave allocations for {selectedYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Balances
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Allocation</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAllocation}</div>
            <p className="text-xs text-muted-foreground">
              days across {balances.length} employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Used Leaves</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalUsed}</div>
            <p className="text-xs text-muted-foreground">
              {totalAllocation > 0 ? Math.round((totalUsed / totalAllocation) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalPending}</div>
            <p className="text-xs text-muted-foreground">
              awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalRemaining}</div>
            <p className="text-xs text-muted-foreground">
              available to use
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Balance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Leave Balances</CardTitle>
          <CardDescription>Annual leave allocation and usage per employee</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-center">Annual Allocation</TableHead>
                  <TableHead className="text-center">Carried Forward</TableHead>
                  <TableHead className="text-center">Total Available</TableHead>
                  <TableHead className="text-center">Used</TableHead>
                  <TableHead className="text-center">Pending</TableHead>
                  <TableHead className="text-center">Remaining</TableHead>
                  <TableHead className="text-center">Usage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No employees found
                    </TableCell>
                  </TableRow>
                ) : (
                  balances.map((balance) => {
                    const totalAvailable = balance.annual_allocation + balance.carried_forward;
                    const usagePercent = totalAvailable > 0 
                      ? Math.round((balance.used_leaves / totalAvailable) * 100) 
                      : 0;
                    
                    return (
                      <TableRow key={balance.user_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{balance.profiles?.full_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{balance.profiles?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{balance.annual_allocation}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {balance.carried_forward > 0 ? (
                            <Badge variant="secondary">+{balance.carried_forward}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {totalAvailable}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="destructive" className="bg-red-500/10 text-red-600">
                            {balance.used_leaves}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {balance.pending_leaves > 0 ? (
                            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                              {balance.pending_leaves}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="default" 
                            className={balance.remaining_leaves <= 3 
                              ? 'bg-red-500/10 text-red-600' 
                              : 'bg-green-500/10 text-green-600'
                            }
                          >
                            {balance.remaining_leaves}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="relative h-2 w-16 overflow-hidden rounded-full bg-secondary">
                              <div
                                className={`h-full transition-all ${
                                  usagePercent > 80 ? 'bg-red-500' : 
                                  usagePercent > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-8">
                              {usagePercent}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditClick(balance)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Leave Allocation</DialogTitle>
                                <DialogDescription>
                                  Update leave allocation for {balance.profiles?.full_name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="allocation">Annual Allocation (days)</Label>
                                  <Input
                                    id="allocation"
                                    type="number"
                                    min="0"
                                    max="365"
                                    value={newAllocation}
                                    onChange={(e) => setNewAllocation(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="carried">Carried Forward (days)</Label>
                                  <Input
                                    id="carried"
                                    type="number"
                                    min="0"
                                    max="365"
                                    value={newCarriedForward}
                                    onChange={(e) => setNewCarriedForward(e.target.value)}
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Leaves carried from previous year
                                  </p>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button onClick={handleSaveAllocation} disabled={isSaving}>
                                  {isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
