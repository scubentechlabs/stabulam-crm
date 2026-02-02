import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFlags, type FlagFilters, type Flag } from '@/hooks/useFlags';
import { FlagForm } from '@/components/flags/FlagForm';
import { FlagTable } from '@/components/flags/FlagTable';
import { FlagFilters as FlagFiltersComponent } from '@/components/flags/FlagFilters';
import { FlagDetailDialog } from '@/components/flags/FlagDetailDialog';
import { FlagAnalyticsDashboard } from '@/components/flags/FlagAnalyticsDashboard';
import {
  Flag as FlagIcon,
  Plus,
  List,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';

export default function AdminFlags() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('list');
  const [filters, setFilters] = useState<FlagFilters>(() => {
    const employeeParam = searchParams.get('employee');
    return employeeParam ? { employeeId: employeeParam } : {};
  });
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<Flag | null>(null);
  const [showFlagDetail, setShowFlagDetail] = useState(false);

  // Handle URL param changes
  useEffect(() => {
    const employeeParam = searchParams.get('employee');
    if (employeeParam && employeeParam !== filters.employeeId) {
      setFilters(prev => ({ ...prev, employeeId: employeeParam }));
    }
  }, [searchParams]);

  const { flags, isLoading } = useFlags(filters);

  const handleViewDetails = (flag: Flag) => {
    setSelectedFlag(flag);
    setShowFlagDetail(true);
  };

  const handleDateSelect = (date: Date) => {
    setFilters({ ...filters, dateFrom: date, dateTo: date });
    setActiveTab('list');
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setFilters({ ...filters, employeeId });
    setActiveTab('list');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-destructive/10">
              <FlagIcon className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Employee Flags
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage employee flags, violations, and internal notices
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => setShowFlagForm(true)} variant="destructive">
          <Plus className="mr-2 h-4 w-4" />
          Issue New Flag
        </Button>
      </div>

      {/* Warning Banner */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-amber-700 dark:text-amber-400">
                Important:
              </span>{' '}
              <span className="text-amber-600 dark:text-amber-300">
                Flags are permanent records and cannot be deleted or edited after creation.
                Ensure all information is accurate before issuing.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-11 p-1 bg-muted/50 rounded-xl border">
          <TabsTrigger
            value="list"
            className="gap-2 h-9 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">All Flags</span>
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="gap-2 h-9 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6 space-y-4">
          <FlagFiltersComponent filters={filters} onFiltersChange={setFilters} />
          <FlagTable
            flags={flags}
            isLoading={isLoading}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <FlagAnalyticsDashboard
            onDateSelect={handleDateSelect}
            onEmployeeSelect={handleEmployeeSelect}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <FlagForm open={showFlagForm} onOpenChange={setShowFlagForm} />
      <FlagDetailDialog
        flag={selectedFlag}
        open={showFlagDetail}
        onOpenChange={setShowFlagDetail}
      />
    </div>
  );
}
