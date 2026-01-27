import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Plus } from 'lucide-react';

export default function Tasks() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Tasks</h1>
          <p className="page-description">Manage your daily tasks (TOD/EOD)</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task of the Day (TOD)</CardTitle>
          <CardDescription>Your planned tasks for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No tasks submitted yet</p>
            <p className="text-sm">Clock in to submit your TOD</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
