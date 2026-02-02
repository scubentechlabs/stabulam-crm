-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can delete shoot assignments" ON public.shoot_assignments;
DROP POLICY IF EXISTS "Authenticated users can insert shoot assignments" ON public.shoot_assignments;

-- Allow all authenticated users to insert shoot assignments
CREATE POLICY "Authenticated users can insert shoot assignments"
ON public.shoot_assignments
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow all authenticated users to delete shoot assignments
CREATE POLICY "Authenticated users can delete shoot assignments"
ON public.shoot_assignments
FOR DELETE
TO authenticated
USING (true);