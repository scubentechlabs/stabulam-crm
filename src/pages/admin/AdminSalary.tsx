import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Calculator, Download } from 'lucide-react';

export default function AdminSalary() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Salary Generator</h1>
          <p className="page-description">Calculate and generate employee salaries</p>
        </div>
        <Button>
          <Calculator className="h-4 w-4 mr-2" />
          Generate Salary
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Period</CardTitle>
            <CardDescription>Choose salary calculation period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Select employees and period to generate salary</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Salary Records</CardTitle>
            <CardDescription>Previously generated salary slips</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Download className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No salary records yet</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
