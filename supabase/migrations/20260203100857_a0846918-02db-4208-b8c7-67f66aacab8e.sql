-- Add assigned_by column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN assigned_by uuid REFERENCES auth.users(id);

-- Create trigger to auto-populate assigned_by on insert
CREATE OR REPLACE FUNCTION public.set_task_assigned_by()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set assigned_by if the task is being created for someone else
  IF auth.uid() IS NOT NULL AND auth.uid() != NEW.user_id THEN
    NEW.assigned_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER set_task_assigned_by_trigger
BEFORE INSERT ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.set_task_assigned_by();