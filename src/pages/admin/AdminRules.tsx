import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Clock, Calendar, Briefcase, DollarSign } from 'lucide-react';

export default function AdminRules() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Rules Configuration</h1>
          <p className="page-description">Configure policies and deduction rules</p>
        </div>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Late Arrival Policy
            </CardTitle>
            <CardDescription>Configure late coming deductions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Up to 30 min late</span>
              <span className="font-medium">₹100</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">30 min - 1 hour late</span>
              <span className="font-medium">₹200</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">1 - 1.5 hours late</span>
              <span className="font-medium">Half-day salary</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">1.5+ hours late</span>
              <span className="font-medium">Full-day salary</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Leave Policy
            </CardTitle>
            <CardDescription>Configure leave deductions and penalties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Advance notice requirement</span>
              <span className="font-medium">48 hours</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Penalty without notice</span>
              <span className="font-medium">₹250</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Half-day with notice</span>
              <span className="font-medium">₹250</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Extra Work Policy
            </CardTitle>
            <CardDescription>Configure overtime compensation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">1 hour extra</span>
              <span className="font-medium">₹150</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">2 hours extra</span>
              <span className="font-medium">₹250</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">3 hours extra</span>
              <span className="font-medium">₹350</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">4 hours extra</span>
              <span className="font-medium">₹450</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Reporting Policy
            </CardTitle>
            <CardDescription>Configure TOD/EOD penalties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Missing TOD penalty</span>
              <span className="font-medium">₹100/day</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Missing EOD penalty</span>
              <span className="font-medium">₹100/day</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
