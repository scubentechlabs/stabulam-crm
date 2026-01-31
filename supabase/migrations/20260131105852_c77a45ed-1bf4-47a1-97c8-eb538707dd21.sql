-- Add 'utod' (Upcoming Task of the Day) to the task_type enum
ALTER TYPE public.task_type ADD VALUE IF NOT EXISTS 'utod';

-- Add 'eod' type if we want to distinguish EOD tasks
ALTER TYPE public.task_type ADD VALUE IF NOT EXISTS 'eod';