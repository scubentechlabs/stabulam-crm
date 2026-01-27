import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BulkActionsBarProps {
  selectedCount: number;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onClearSelection: () => void;
  isProcessing?: boolean;
  approveLabel?: string;
  rejectLabel?: string;
}

export function BulkActionsBar({
  selectedCount,
  onApproveAll,
  onRejectAll,
  onClearSelection,
  isProcessing = false,
  approveLabel = 'Approve All',
  rejectLabel = 'Reject All',
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 p-3 mb-4 rounded-lg bg-muted/50 border animate-fade-in">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-xs h-7"
        >
          Clear
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
          onClick={onApproveAll}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          {approveLabel}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive border-destructive/20 hover:bg-destructive/10"
          onClick={onRejectAll}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <X className="h-4 w-4 mr-2" />
          )}
          {rejectLabel}
        </Button>
      </div>
    </div>
  );
}
