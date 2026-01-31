import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, FileText } from 'lucide-react';
import { SalaryCalculator } from '@/components/salary/SalaryCalculator';
import { SalaryRecordsList } from '@/components/salary/SalaryRecordsList';

export default function AdminSalary() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Salary Calculator</h1>
        <p className="page-description">Generate individual employee salaries with customizable adjustments</p>
      </div>

      <Tabs defaultValue="calculate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calculate" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculate
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Records
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculate">
          <SalaryCalculator />
        </TabsContent>

        <TabsContent value="records">
          <SalaryRecordsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
