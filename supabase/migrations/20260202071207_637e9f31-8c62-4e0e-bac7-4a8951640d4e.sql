-- Drop existing restrictive SELECT policy
DROP POLICY IF EXISTS "shoots_select_owned_assigned_or_admin" ON public.shoots;

-- Create new policy allowing all authenticated users to view all shoots
CREATE POLICY "All authenticated users can view all shoots"
ON public.shoots
FOR SELECT
TO authenticated
USING (true);

-- Drop existing restrictive UPDATE policy
DROP POLICY IF EXISTS "shoots_update_creator_assigned_admin" ON public.shoots;

-- Create new policy allowing all authenticated users to update shoots (for status changes)
CREATE POLICY "All authenticated users can update shoots"
ON public.shoots
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);