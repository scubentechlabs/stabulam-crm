import { useState } from 'react';
import { Plus, Loader2, X, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    return taskType === 'tod' ? 'Add Tasks of the Day' : 'Add Urgent Tasks';
  };

  const getDialogDescription = () => {
    return taskType === 'tod' 
      ? 'Add one or more planned tasks for today.'
      : 'Add one or more unplanned or emergency tasks.';
  };

  const getButtonText = () => {
    return buttonText || (taskType === 'tod' ? 'Add TOD Task' : 'Add Urgent Task');
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
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription>{getDialogDescription()}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
            <Label>Task Titles *</Label>
            {titles.map((title, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Task ${index + 1}`}
                  value={title}
                  onChange={(e) => handleTitleChange(index, e.target.value)}
                  autoFocus={index === titles.length - 1}
                />
                {titles.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveTitle(index)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTitle}
              className="w-full"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Another Task
            </Button>
          </div>

          <DialogFooter>
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
                `Add ${validTitlesCount} Task${validTitlesCount !== 1 ? 's' : ''}`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
