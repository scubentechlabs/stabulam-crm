import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Save, Loader2 } from 'lucide-react';
import type { LeavePolicy } from '@/hooks/useRulesConfig';

interface LeavePolicyEditorProps {
  policy: LeavePolicy | null;
  onSave: (policy: LeavePolicy) => Promise<boolean>;
  isSaving: boolean;
}

export function LeavePolicyEditor({ policy, onSave, isSaving }: LeavePolicyEditorProps) {
  const [advanceNoticeHours, setAdvanceNoticeHours] = useState(48);
  const [penaltyWithoutNotice, setPenaltyWithoutNotice] = useState(250);
  const [halfDayDeduction, setHalfDayDeduction] = useState(250);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (policy) {
      setAdvanceNoticeHours(policy.advance_notice_hours);
      setPenaltyWithoutNotice(policy.penalty_without_notice);
      setHalfDayDeduction(policy.half_day_with_notice_deduction);
      setHasChanges(false);
    }
  }, [policy]);

  const handleChange = (setter: (val: number) => void, value: number) => {
    setter(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    const success = await onSave({
      advance_notice_hours: advanceNoticeHours,
      penalty_without_notice: penaltyWithoutNotice,
      half_day_with_notice_deduction: halfDayDeduction,
    });
    if (success) setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Leave Policy
        </CardTitle>
        <CardDescription>Configure leave deductions and penalties</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-muted/50 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="advance-notice">Advance Notice Requirement (hours)</Label>
            <Input
              id="advance-notice"
              type="number"
              value={advanceNoticeHours}
              onChange={(e) => handleChange(setAdvanceNoticeHours, parseInt(e.target.value) || 0)}
              min={0}
            />
            <p className="text-xs text-muted-foreground">
              Minimum hours before leave starts that employee must apply
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="penalty-no-notice">Penalty Without Notice (₹)</Label>
            <Input
              id="penalty-no-notice"
              type="number"
              value={penaltyWithoutNotice}
              onChange={(e) => handleChange(setPenaltyWithoutNotice, parseInt(e.target.value) || 0)}
              min={0}
            />
            <p className="text-xs text-muted-foreground">
              Deduction when leave is taken without required advance notice
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="half-day-deduction">Half-day With Notice Deduction (₹)</Label>
            <Input
              id="half-day-deduction"
              type="number"
              value={halfDayDeduction}
              onChange={(e) => handleChange(setHalfDayDeduction, parseInt(e.target.value) || 0)}
              min={0}
            />
            <p className="text-xs text-muted-foreground">
              Standard deduction for half-day leave with proper notice
            </p>
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || isSaving}
          className="w-full"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
}
