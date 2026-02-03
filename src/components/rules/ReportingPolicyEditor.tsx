import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Save, Loader2 } from 'lucide-react';
import type { ReportingPolicy } from '@/hooks/useRulesConfig';

interface ReportingPolicyEditorProps {
  policy: ReportingPolicy | null;
  onSave: (policy: ReportingPolicy) => Promise<boolean>;
  isSaving: boolean;
}

export function ReportingPolicyEditor({ policy, onSave, isSaving }: ReportingPolicyEditorProps) {
  const [missingTodPenalty, setMissingTodPenalty] = useState(100);
  const [missingEodPenalty, setMissingEodPenalty] = useState(100);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (policy) {
      setMissingTodPenalty(policy.missing_tod_penalty);
      setMissingEodPenalty(policy.missing_eod_penalty);
      setHasChanges(false);
    }
  }, [policy]);

  const handleChange = (setter: (val: number) => void, value: number) => {
    setter(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    const success = await onSave({
      missing_tod_penalty: missingTodPenalty,
      missing_eod_penalty: missingEodPenalty,
    });
    if (success) setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Reporting Policy
        </CardTitle>
        <CardDescription>Configure TOD/EOD penalties</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-muted/50 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="tod-penalty">Missing TOD Penalty (₹/day)</Label>
            <Input
              id="tod-penalty"
              type="number"
              value={missingTodPenalty}
              onChange={(e) => handleChange(setMissingTodPenalty, parseInt(e.target.value) || 0)}
              min={0}
            />
            <p className="text-xs text-muted-foreground">
              Daily penalty for not submitting Task of the Day
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="eod-penalty">Missing EOD Penalty (₹/day)</Label>
            <Input
              id="eod-penalty"
              type="number"
              value={missingEodPenalty}
              onChange={(e) => handleChange(setMissingEodPenalty, parseInt(e.target.value) || 0)}
              min={0}
            />
            <p className="text-xs text-muted-foreground">
              Daily penalty for not submitting End of Day report
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
