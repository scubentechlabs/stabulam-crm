import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Save, Loader2, Plus, Trash2, AlertTriangle } from 'lucide-react';
import type { LatePolicy, LatePolicyTier } from '@/hooks/useRulesConfig';

interface ValidationError {
  tierIndex: number;
  field: 'min_minutes' | 'max_minutes' | 'general';
  message: string;
}

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

  // Validation logic
  const validationErrors = useMemo((): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    tiers.forEach((tier, index) => {
      // Check if min is negative
      if (tier.min_minutes < 0) {
        errors.push({ tierIndex: index, field: 'min_minutes', message: 'Min minutes cannot be negative' });
      }
      
      // Check if max is less than min (when max is set)
      if (tier.max_minutes !== null && tier.max_minutes < tier.min_minutes) {
        errors.push({ tierIndex: index, field: 'max_minutes', message: 'Max must be greater than min' });
      }
      
      // Check for overlaps with other tiers
      tiers.forEach((otherTier, otherIndex) => {
        if (index >= otherIndex) return; // Only check each pair once
        
        const tier1Min = tier.min_minutes;
        const tier1Max = tier.max_minutes ?? Infinity;
        const tier2Min = otherTier.min_minutes;
        const tier2Max = otherTier.max_minutes ?? Infinity;
        
        // Check if ranges overlap
        if (tier1Min <= tier2Max && tier1Max >= tier2Min) {
          errors.push({ 
            tierIndex: index, 
            field: 'general', 
            message: `Overlaps with Tier ${otherIndex + 1}` 
          });
        }
      });
      
      // Only the last tier should have null max_minutes
      if (tier.max_minutes === null && index !== tiers.length - 1) {
        errors.push({ 
          tierIndex: index, 
          field: 'max_minutes', 
          message: 'Only the last tier can have no limit' 
        });
      }
    });
    
    // Check for gaps between tiers (sorted by min_minutes)
    const sortedTiers = [...tiers].map((t, i) => ({ ...t, originalIndex: i })).sort((a, b) => a.min_minutes - b.min_minutes);
    for (let i = 0; i < sortedTiers.length - 1; i++) {
      const current = sortedTiers[i];
      const next = sortedTiers[i + 1];
      
      if (current.max_minutes !== null && next.min_minutes > current.max_minutes + 1) {
        errors.push({ 
          tierIndex: current.originalIndex, 
          field: 'general', 
          message: `Gap exists before Tier ${next.originalIndex + 1}` 
        });
      }
    }
    
    return errors;
  }, [tiers]);

  const hasValidationErrors = validationErrors.length > 0;

  const getErrorsForTier = (tierIndex: number) => {
    return validationErrors.filter(e => e.tierIndex === tierIndex);
  };

  const updateTier = (index: number, field: keyof LatePolicyTier, value: any) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
    setHasChanges(true);
  };

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMinMinutes = lastTier ? (lastTier.max_minutes || 90) + 1 : 1;
    
    // Update the previous last tier to have a max_minutes if it was null
    if (lastTier && lastTier.max_minutes === null) {
      const newTiers = [...tiers];
      newTiers[tiers.length - 1] = { ...lastTier, max_minutes: newMinMinutes - 1 };
      setTiers([...newTiers, { min_minutes: newMinMinutes, max_minutes: null, deduction: 0 }]);
    } else {
      setTiers([...tiers, { min_minutes: newMinMinutes, max_minutes: null, deduction: 0 }]);
    }
    setHasChanges(true);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (hasValidationErrors) return;
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
        {hasValidationErrors && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please fix the validation errors below before saving.
            </AlertDescription>
          </Alert>
        )}

        {tiers.map((tier, index) => {
          const tierErrors = getErrorsForTier(index);
          const hasError = tierErrors.length > 0;
          
          return (
            <div 
              key={index} 
              className={`p-4 rounded-lg space-y-3 ${hasError ? 'bg-destructive/10 border border-destructive/30' : 'bg-muted/50'}`}
            >
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
              
              {hasError && (
                <div className="space-y-1">
                  {tierErrors.map((error, errorIndex) => (
                    <p key={errorIndex} className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {error.message}
                    </p>
                  ))}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Min Minutes</Label>
                  <Input
                    type="number"
                    value={tier.min_minutes}
                    onChange={(e) => updateTier(index, 'min_minutes', parseInt(e.target.value) || 0)}
                    min={0}
                    className={tierErrors.some(e => e.field === 'min_minutes') ? 'border-destructive' : ''}
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
                    className={tierErrors.some(e => e.field === 'max_minutes') ? 'border-destructive' : ''}
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
          );
        })}

        <Button variant="outline" onClick={addTier} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Tier
        </Button>

        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || isSaving || hasValidationErrors}
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
