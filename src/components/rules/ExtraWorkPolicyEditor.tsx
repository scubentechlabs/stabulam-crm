import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Briefcase, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import type { ExtraWorkPolicy, ExtraWorkTier } from '@/hooks/useRulesConfig';

interface ExtraWorkPolicyEditorProps {
  policy: ExtraWorkPolicy | null;
  onSave: (policy: ExtraWorkPolicy) => Promise<boolean>;
  isSaving: boolean;
}

export function ExtraWorkPolicyEditor({ policy, onSave, isSaving }: ExtraWorkPolicyEditorProps) {
  const [tiers, setTiers] = useState<ExtraWorkTier[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (policy) {
      setTiers(policy.tiers);
      setHasChanges(false);
    }
  }, [policy]);

  const updateTier = (index: number, field: keyof ExtraWorkTier, value: number) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
    setHasChanges(true);
  };

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newHours = lastTier ? lastTier.hours + 1 : 1;
    setTiers([...tiers, { hours: newHours, compensation: 0 }]);
    setHasChanges(true);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleSave = async () => {
    // Sort tiers by hours before saving
    const sortedTiers = [...tiers].sort((a, b) => a.hours - b.hours);
    const success = await onSave({ tiers: sortedTiers });
    if (success) setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Extra Work Policy
        </CardTitle>
        <CardDescription>Configure overtime compensation tiers</CardDescription>
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
                <Label className="text-xs">Hours</Label>
                <Input
                  type="number"
                  value={tier.hours}
                  onChange={(e) => updateTier(index, 'hours', parseInt(e.target.value) || 0)}
                  min={1}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Compensation (₹)</Label>
                <Input
                  type="number"
                  value={tier.compensation}
                  onChange={(e) => updateTier(index, 'compensation', parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>
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
