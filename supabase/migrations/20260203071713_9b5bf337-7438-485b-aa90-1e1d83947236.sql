-- Add 'task_assigned' to notification_type enum
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'task_assigned';

-- Create trigger function to notify employee when a task is assigned
CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  task_type_label TEXT;
BEGIN
  -- Only create notification if the task was assigned by someone else (admin assigning to employee)
  -- auth.uid() returns the user who made the insert
  IF auth.uid() IS NOT NULL AND auth.uid() != NEW.user_id THEN
    -- Get a readable label for task type
    CASE NEW.task_type
      WHEN 'tod' THEN task_type_label := 'TOD';
      WHEN 'utod' THEN task_type_label := 'UTOD';
      WHEN 'urgent_tod' THEN task_type_label := 'UTOD';
      WHEN 'eod' THEN task_type_label := 'EOD';
      ELSE task_type_label := 'Task';
    END CASE;
    
    INSERT INTO public.notifications (
      user_id,
      notification_type,
      title,
      message,
      reference_id,
      reference_type
    ) VALUES (
      NEW.user_id,
      'task_assigned',
      '📋 New ' || task_type_label || ' Task Assigned',
      '"' || NEW.title || '" has been assigned to you',
      NEW.id,
      'task'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on tasks table
DROP TRIGGER IF EXISTS trigger_notify_task_assigned ON public.tasks;
CREATE TRIGGER trigger_notify_task_assigned
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_assigned();