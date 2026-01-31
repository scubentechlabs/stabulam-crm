-- Allow all authenticated users to update shoot status (not just creator/admin)
DROP POLICY IF EXISTS "Users can update their own shoots or admins can update all" ON public.shoots;

CREATE POLICY "Authenticated users can update shoots"
ON public.shoots
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow creator, assigned team members, and admins to delete shoots
DROP POLICY IF EXISTS "Admins can delete shoots" ON public.shoots;

CREATE POLICY "Creator, assigned users, or admins can delete shoots"
ON public.shoots
FOR DELETE
USING (
  auth.uid() = created_by 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.shoot_assignments 
    WHERE shoot_id = shoots.id 
    AND user_id = auth.uid()
  )
);