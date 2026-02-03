import { Skeleton } from '@/components/ui/skeleton';
import { useRulesConfig } from '@/hooks/useRulesConfig';
import { LatePolicyEditor } from '@/components/rules/LatePolicyEditor';
import { LeavePolicyEditor } from '@/components/rules/LeavePolicyEditor';
import { ExtraWorkPolicyEditor } from '@/components/rules/ExtraWorkPolicyEditor';
import { ReportingPolicyEditor } from '@/components/rules/ReportingPolicyEditor';

export default function AdminRules() {
  const {
    isLoading,
    isSaving,
    getLatePolicy,
    getLeavePolicy,
    getExtraWorkPolicy,
    getReportingPolicy,
    updateLatePolicy,
    updateLeavePolicy,
    updateExtraWorkPolicy,
    updateReportingPolicy,
  } = useRulesConfig();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Rules Configuration</h1>
          <p className="page-description">Configure policies and deduction rules</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[400px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Rules Configuration</h1>
        <p className="page-description">Configure policies and deduction rules</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <LatePolicyEditor
          policy={getLatePolicy()}
          onSave={updateLatePolicy}
          isSaving={isSaving}
        />

        <LeavePolicyEditor
          policy={getLeavePolicy()}
          onSave={updateLeavePolicy}
          isSaving={isSaving}
        />

        <ExtraWorkPolicyEditor
          policy={getExtraWorkPolicy()}
          onSave={updateExtraWorkPolicy}
          isSaving={isSaving}
        />

        <ReportingPolicyEditor
          policy={getReportingPolicy()}
          onSave={updateReportingPolicy}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
