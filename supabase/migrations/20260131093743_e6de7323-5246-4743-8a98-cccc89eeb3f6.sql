-- Drop overly permissive UPDATE policies
DROP POLICY IF EXISTS "Authenticated users can update shoots" ON public.shoots;
DROP POLICY IF EXISTS "shoots_authenticated_update" ON public.shoots;

-- Create proper UPDATE policy: creators, assigned users, or admins can update
CREATE POLICY "shoots_update_creator_assigned_admin" ON public.shoots
FOR UPDATE TO authenticated
USING (
  auth.uid() = created_by 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR EXISTS (
    SELECT 1 FROM shoot_assignments sa 
    WHERE sa.shoot_id = shoots.id AND sa.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = created_by 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR EXISTS (
    SELECT 1 FROM shoot_assignments sa 
    WHERE sa.shoot_id = shoots.id AND sa.user_id = auth.uid()
  )
);

-- Clean up duplicate shoot_assignments SELECT policy
DROP POLICY IF EXISTS "shoot_assignments_authenticated_select" ON public.shoot_assignments;