import { useState } from 'react';
import { Plus, Loader2, Trash2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Database } from '@/integrations/supabase/types';

type TaskType = Database['public']['Enums']['task_type'];

interface TaskFormProps {
  taskType: TaskType;
  onSubmit: (title: string, description: string | null) => Promise<boolean>;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary';
}

export function TaskForm({ 
  taskType, 
  onSubmit, 
  buttonText,
  buttonVariant = 'default',
}: TaskFormProps) {
  const [open, setOpen] = useState(false);
  const [titles, setTitles] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTitle = () => {
    setTitles([...titles, '']);
  };

  const handleRemoveTitle = (index: number) => {
    if (titles.length > 1) {
      setTitles(titles.filter((_, i) => i !== index));
    }
  };

  const handleTitleChange = (index: number, value: string) => {
    const newTitles = [...titles];
    newTitles[index] = value;
    setTitles(newTitles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validTitles = titles.filter(t => t.trim());
    if (validTitles.length === 0) return;

    setIsSubmitting(true);
    
    let allSuccess = true;
    for (const title of validTitles) {
      const success = await onSubmit(title.trim(), null);
      if (!success) {
        allSuccess = false;
        break;
      }
    }

    setIsSubmitting(false);

    if (allSuccess) {
      setTitles(['']);
      setOpen(false);
    }
  };

  const getDialogTitle = () => {
    if (taskType === 'tod') return 'Add Tasks of the Day';
    if (taskType === 'utod') return 'Add UTOD (Urgent Task of the Day)';
    return 'Add EOD Tasks';
  };

  const getDialogDescription = () => {
    if (taskType === 'tod') return 'Add your planned tasks for today. You can add multiple tasks at once.';
    if (taskType === 'utod') return 'Add unplanned or emergency tasks.';
    return 'Add end of day tasks.';
  };

  const getButtonText = () => {
    if (buttonText) return buttonText;
    if (taskType === 'tod') return 'Add TOD Task';
    if (taskType === 'utod') return 'Add UTOD Task';
    return 'Add EOD Task';
  };

  const validTitlesCount = titles.filter(t => t.trim()).length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setTitles(['']);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant}>
          <Plus className="h-4 w-4 mr-2" />
          {getButtonText()}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription>{getDialogDescription()}</DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {titles.map((title, index) => (
                <div key={index} className="flex items-center gap-2 group">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                    {index + 1}
                  </div>
                  <Input
                    placeholder="Enter task title..."
                    value={title}
                    onChange={(e) => handleTitleChange(index, e.target.value)}
                    autoFocus={index === titles.length - 1}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveTitle(index)}
                    disabled={titles.length === 1}
                    className={`shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive transition-opacity ${
                      titles.length === 1 ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddTitle}
              className="w-full mt-4 border border-dashed border-border hover:border-primary hover:bg-primary/5 text-muted-foreground hover:text-primary transition-colors"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Another Task
            </Button>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={validTitlesCount === 0 || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add {validTitlesCount} Task{validTitlesCount !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
