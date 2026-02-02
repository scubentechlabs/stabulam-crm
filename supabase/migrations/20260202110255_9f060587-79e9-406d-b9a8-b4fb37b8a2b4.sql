-- Drop the restrictive user SELECT policy
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;

-- Create a new policy that allows all authenticated users to view all tasks
CREATE POLICY "Authenticated users can view all tasks" 
ON public.tasks 
FOR SELECT 
USING (auth.uid() IS NOT NULL);