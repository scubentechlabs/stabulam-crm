import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import type { LatePolicy, LatePolicyTier } from '@/hooks/useRulesConfig';

interface LatePolicyEditorProps {
  policy: LatePolicy | null;
  onSave: (policy: LatePolicy) => Promise<boolean>;
  isSaving: boolean;
}

export function LatePolicyEditor({ policy, onSave, isSaving }: LatePolicyEditorProps) {
  const [tiers, setTiers] = useState<LatePolicyTier[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (policy) {
      setTiers(policy.tiers);
      setHasChanges(false);
    }
  }, [policy]);

  const updateTier = (index: number, field: keyof LatePolicyTier, value: any) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
    setHasChanges(true);
  };

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMinMinutes = lastTier ? (lastTier.max_minutes || 90) + 1 : 1;
    setTiers([...tiers, { min_minutes: newMinMinutes, max_minutes: null, deduction: 0 }]);
    setHasChanges(true);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const success = await onSave({ tiers });
    if (success) setHasChanges(false);
  };

  const formatTierLabel = (tier: LatePolicyTier, index: number) => {
    if (tier.max_minutes === null) {
      return `${tier.min_minutes}+ minutes late`;
    }
    return `${tier.min_minutes} - ${tier.max_minutes} minutes late`;
  };

  const getDeductionDisplay = (tier: LatePolicyTier) => {
    if (tier.deduction_type === 'half_day') return 'Half-day salary';
    if (tier.deduction_type === 'full_day') return 'Full-day salary';
    return `₹${tier.deduction || 0}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Late Arrival Policy
        </CardTitle>
        <CardDescription>Configure late coming deductions (applies after 30-min grace period)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tiers.map((tier, index) => (
          <div key={index} className="p-4 rounded-lg bg-muted/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Tier {index + 1}</span>
              {tiers.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTier(index)}
                  className="h-8 w-8 p-0 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Min Minutes</Label>
                <Input
                  type="number"
                  value={tier.min_minutes}
                  onChange={(e) => updateTier(index, 'min_minutes', parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Max Minutes</Label>
                <Input
                  type="number"
                  value={tier.max_minutes ?? ''}
                  onChange={(e) => updateTier(index, 'max_minutes', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="No limit"
                  min={0}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Deduction Type</Label>
                <Select
                  value={tier.deduction_type || 'fixed'}
                  onValueChange={(value) => {
                    if (value === 'fixed') {
                      updateTier(index, 'deduction_type', undefined);
                      updateTier(index, 'deduction', 0);
                    } else {
                      updateTier(index, 'deduction_type', value);
                      updateTier(index, 'deduction', undefined);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="half_day">Half-day Salary</SelectItem>
                    <SelectItem value="full_day">Full-day Salary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!tier.deduction_type && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Amount (₹)</Label>
                  <Input
                    type="number"
                    value={tier.deduction || 0}
                    onChange={(e) => updateTier(index, 'deduction', parseInt(e.target.value) || 0)}
                    min={0}
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={addTier} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Tier
        </Button>

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
