import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Save, X, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { GeneratedSalary } from './types';

interface SalaryPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salary: GeneratedSalary | null;
  onSave: () => Promise<void>;
  isSaving?: boolean;
}

export function SalaryPreviewDialog({
  open,
  onOpenChange,
  salary,
  onSave,
  isSaving = false,
}: SalaryPreviewDialogProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  if (!salary) return null;

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      
      // Generate a printable HTML version
      const htmlContent = generateSalarySlipHTML(salary);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      }

      toast({
        title: 'PDF Ready',
        description: 'Use Print → Save as PDF to download the salary slip.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSave = async () => {
    await onSave();
    setIsSaved(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Final Salary Preview</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Download PDF</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Header Info */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{salary.employeeName}</h3>
              <p className="text-sm text-muted-foreground">{salary.monthYear}</p>
            </div>
            <Badge variant="outline" className="text-xs">
              Slip #{salary.slipNumber || 'DRAFT'}
            </Badge>
          </div>

          <Separator />

          {/* Salary Breakdown Table */}
          <div className="space-y-3">
            {/* Base Salary */}
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">Base Salary</span>
              <span className="font-semibold">{formatCurrency(salary.baseSalary)}</span>
            </div>

            {/* Additions */}
            {(salary.overtimeAmount > 0 || salary.bonusAmount > 0) && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-green-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Additions
                </h4>
                
                {salary.overtimeAmount > 0 && (
                  <div className="flex justify-between text-sm pl-4">
                    <span className="text-muted-foreground">
                      Overtime Pay ({salary.overtimeHours.toFixed(1)} hrs × ₹{salary.overtimeRate})
                    </span>
                    <span className="text-green-600 font-medium">+{formatCurrency(salary.overtimeAmount)}</span>
                  </div>
                )}
                
                {salary.bonusAmount > 0 && (
                  <div className="flex justify-between text-sm pl-4">
                    <span className="text-muted-foreground">
                      Bonus {salary.bonusNote && <span className="text-xs">({salary.bonusNote})</span>}
                    </span>
                    <span className="text-green-600 font-medium">+{formatCurrency(salary.bonusAmount)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Deductions */}
            {(salary.lateDeduction > 0 || salary.customDeductionAmount > 0) && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-destructive flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-destructive" />
                  Deductions
                </h4>
                
                {salary.lateDeduction > 0 && (
                  <div className="flex justify-between text-sm pl-4">
                    <span className="text-muted-foreground">
                      Late Deduction ({salary.lateArrivalsCount} arrivals, {salary.totalLateMinutes} min)
                    </span>
                    <span className="text-destructive font-medium">-{formatCurrency(salary.lateDeduction)}</span>
                  </div>
                )}
                
                {salary.customDeductionAmount > 0 && (
                  <div className="flex justify-between text-sm pl-4">
                    <span className="text-muted-foreground">
                      Custom Deduction {salary.customDeductionNote && <span className="text-xs">({salary.customDeductionNote})</span>}
                    </span>
                    <span className="text-destructive font-medium">-{formatCurrency(salary.customDeductionAmount)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Net Payable */}
          <div className="bg-primary/5 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Net Payable Salary</span>
              <span className="text-3xl font-bold text-primary">{formatCurrency(salary.netSalary)}</span>
            </div>
          </div>

          {isSaved && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Salary record saved successfully!</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          {!isSaved && (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Salary Record
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function generateSalarySlipHTML(salary: GeneratedSalary): string {
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Salary Slip - ${salary.employeeName} - ${salary.monthYear}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #eee;
    }
    .header h1 {
      margin: 0;
      color: #2563eb;
      font-size: 24px;
    }
    .header p {
      margin: 5px 0 0;
      color: #666;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .info-item {
      text-align: left;
    }
    .info-item.right {
      text-align: right;
    }
    .info-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 3px;
    }
    .info-value {
      font-weight: 600;
      font-size: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th {
      background-color: #f8f9fa;
      font-weight: 600;
      font-size: 13px;
    }
    .amount {
      text-align: right;
      font-family: monospace;
      font-size: 14px;
    }
    .addition {
      color: #16a34a;
    }
    .deduction {
      color: #dc2626;
    }
    .net-salary {
      background-color: #f0f9ff;
      font-size: 18px;
    }
    .net-salary td {
      padding: 16px 12px;
      font-weight: 700;
      border-bottom: none;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #888;
    }
    .signature {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      text-align: center;
      width: 200px;
    }
    .signature-line {
      border-top: 1px solid #333;
      margin-top: 50px;
      padding-top: 5px;
      font-size: 12px;
    }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>SALARY SLIP</h1>
    <p>${salary.monthYear}</p>
  </div>

  <div class="info-row">
    <div class="info-item">
      <div class="info-label">Employee Name</div>
      <div class="info-value">${salary.employeeName}</div>
    </div>
    <div class="info-item right">
      <div class="info-label">Slip No.</div>
      <div class="info-value">${salary.slipNumber || 'N/A'}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="amount">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Base Salary</td>
        <td class="amount">${formatCurrency(salary.baseSalary)}</td>
      </tr>
      
      ${salary.overtimeAmount > 0 ? `
      <tr>
        <td>Overtime Pay (${salary.overtimeHours.toFixed(1)} hrs × ₹${salary.overtimeRate})</td>
        <td class="amount addition">+${formatCurrency(salary.overtimeAmount)}</td>
      </tr>
      ` : ''}
      
      ${salary.bonusAmount > 0 ? `
      <tr>
        <td>Bonus ${salary.bonusNote ? `(${salary.bonusNote})` : ''}</td>
        <td class="amount addition">+${formatCurrency(salary.bonusAmount)}</td>
      </tr>
      ` : ''}
      
      ${salary.lateDeduction > 0 ? `
      <tr>
        <td>Late Deduction (${salary.lateArrivalsCount} arrivals, ${salary.totalLateMinutes} min)</td>
        <td class="amount deduction">-${formatCurrency(salary.lateDeduction)}</td>
      </tr>
      ` : ''}
      
      ${salary.customDeductionAmount > 0 ? `
      <tr>
        <td>Custom Deduction ${salary.customDeductionNote ? `(${salary.customDeductionNote})` : ''}</td>
        <td class="amount deduction">-${formatCurrency(salary.customDeductionAmount)}</td>
      </tr>
      ` : ''}
    </tbody>
    <tfoot>
      <tr class="net-salary">
        <td>NET PAYABLE SALARY</td>
        <td class="amount">${formatCurrency(salary.netSalary)}</td>
      </tr>
    </tfoot>
  </table>

  <div class="signature">
    <div class="signature-box">
      <div class="signature-line">Employee Signature</div>
    </div>
    <div class="signature-box">
      <div class="signature-line">Authorized Signature</div>
    </div>
  </div>

  <div class="footer">
    Generated on: ${new Date().toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    })}
  </div>
</body>
</html>
  `;
}
