-- Allow admins to insert tasks for any user
CREATE POLICY "Admins can insert tasks for any user"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update any task
CREATE POLICY "Admins can update any task"
ON public.tasks
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));