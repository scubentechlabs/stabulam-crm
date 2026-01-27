import { Check, X, Loader2, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BulkActionsBarProps {
  selectedCount: number;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onClearSelection: () => void;
  isProcessing?: boolean;
  approveLabel?: string;
  rejectLabel?: string;
  showShortcuts?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onApproveAll,
  onRejectAll,
  onClearSelection,
  isProcessing = false,
  approveLabel = 'Approve All',
  rejectLabel = 'Reject All',
  showShortcuts = true,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 p-3 mb-4 rounded-lg bg-muted/50 border animate-fade-in">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="text-xs h-7"
              >
                Clear
              </Button>
            </TooltipTrigger>
            {showShortcuts && (
              <TooltipContent>
                <p>Press <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Esc</kbd> to clear</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        {showShortcuts && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                  <Keyboard className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <p><kbd className="px-1 py-0.5 rounded bg-muted">Ctrl+A</kbd> Select all</p>
                  <p><kbd className="px-1 py-0.5 rounded bg-muted">Enter</kbd> Approve selected</p>
                  <p><kbd className="px-1 py-0.5 rounded bg-muted">Delete</kbd> Reject selected</p>
                  <p><kbd className="px-1 py-0.5 rounded bg-muted">Esc</kbd> Clear selection</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
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
            </TooltipTrigger>
            {showShortcuts && (
              <TooltipContent>
                <p>Press <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Enter</kbd></p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
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
            </TooltipTrigger>
            {showShortcuts && (
              <TooltipContent>
                <p>Press <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Delete</kbd></p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
