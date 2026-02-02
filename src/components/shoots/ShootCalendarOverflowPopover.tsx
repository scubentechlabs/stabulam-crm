import { useState } from "react";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatTimeOnlyIST } from "@/lib/utils";
import type { ShootWithAssignments } from "@/hooks/useShoots";

type Props = {
  day: Date;
  dayShoots: ShootWithAssignments[];
  remainingCount: number;
  getStatusStyles: (status: string | null) => string;
  getStatusLabel: (status: string | null) => string;
  onShootClick?: (shoot: ShootWithAssignments) => void;
};

export function ShootCalendarOverflowPopover({
  day,
  dayShoots,
  remainingCount,
  getStatusStyles,
  getStatusLabel,
  onShootClick,
}: Props) {
  const [open, setOpen] = useState(false);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div onClick={handleTriggerClick}>
          <Badge
            variant="outline"
            className="text-xs h-5 cursor-pointer hover:bg-muted"
          >
            +{remainingCount} more
          </Badge>
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-72 p-0 z-[9999]"
        align="start"
        onPointerDownOutside={(e) => e.preventDefault()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b">
          <h4 className="font-semibold text-sm">{format(day, "EEEE, MMMM d, yyyy")}</h4>
          <p className="text-xs text-muted-foreground">
            {dayShoots.length} shoot{dayShoots.length > 1 ? "s" : ""} scheduled
          </p>
        </div>

        <div 
          className="p-2 space-y-2 max-h-[300px] overflow-y-auto"
          style={{ overscrollBehavior: 'contain' }}
        >
          {dayShoots.map((shoot) => (
            <button
              key={shoot.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShootClick?.(shoot);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left p-2 rounded-md border hover:bg-muted/50 cursor-pointer transition-colors",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{shoot.event_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{shoot.brand_name}</p>
                </div>
                <Badge
                  className={cn(
                    "text-[10px] px-1.5 py-0 shrink-0",
                    getStatusStyles(shoot.status),
                  )}
                >
                  {getStatusLabel(shoot.status)}
                </Badge>
              </div>

              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                <span>{formatTimeOnlyIST(shoot.shoot_time)}</span>
                <span className="truncate">{shoot.location}</span>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
