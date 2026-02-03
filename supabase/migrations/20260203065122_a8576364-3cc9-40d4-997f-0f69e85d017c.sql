-- Drop the problematic restrictive policies for SELECT on tasks
DROP POLICY IF EXISTS "Admins can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can view all tasks" ON public.tasks;

-- Create a single permissive policy that allows all authenticated users to view all tasks
CREATE POLICY "Authenticated users can view all tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (true);