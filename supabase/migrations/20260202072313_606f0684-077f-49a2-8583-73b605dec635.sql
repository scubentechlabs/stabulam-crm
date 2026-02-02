-- Drop existing restrictive DELETE policies
DROP POLICY IF EXISTS "Creator, assigned users, or admins can delete shoots" ON public.shoots;
DROP POLICY IF EXISTS "shoots_delete_creator_assigned_admin" ON public.shoots;

-- Create new policy allowing all authenticated users to delete any shoot
CREATE POLICY "All authenticated users can delete shoots"
ON public.shoots
FOR DELETE
TO authenticated
USING (true);