-- Drop the existing open SELECT policy on shoots
DROP POLICY IF EXISTS "Authenticated users can view all shoots" ON public.shoots;

-- Create restricted SELECT: user sees shoots they created OR assigned to, admin sees all
CREATE POLICY "shoots_select_owned_assigned_or_admin"
ON public.shoots
FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.shoot_assignments sa
    WHERE sa.shoot_id = shoots.id AND sa.user_id = auth.uid()
  )
);