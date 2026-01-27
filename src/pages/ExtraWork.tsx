import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Plus } from 'lucide-react';

export default function ExtraWork() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Extra Work</h1>
          <p className="page-description">Log overtime and extra work hours</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Log Extra Work
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Extra Work Log</CardTitle>
          <CardDescription>Your overtime work submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No extra work logged</p>
            <p className="text-sm">Available after clock-out</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
