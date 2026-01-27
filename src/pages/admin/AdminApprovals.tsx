import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckSquare, Calendar, Briefcase } from 'lucide-react';

export default function AdminApprovals() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Approval Center</h1>
        <p className="page-description">Review and approve leave and extra work requests</p>
      </div>

      <Tabs defaultValue="leaves">
        <TabsList>
          <TabsTrigger value="leaves" className="gap-2">
            <Calendar className="h-4 w-4" />
            Leave Requests
          </TabsTrigger>
          <TabsTrigger value="extra-work" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Extra Work
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaves" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Leave Requests</CardTitle>
              <CardDescription>Review and approve leave applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending leave requests</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extra-work" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Extra Work Requests</CardTitle>
              <CardDescription>Review and approve overtime claims</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending extra work requests</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
