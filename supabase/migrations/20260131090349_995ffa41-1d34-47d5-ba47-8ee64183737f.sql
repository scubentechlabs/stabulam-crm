-- Shoots & Editing: permissions and assignment visibility

-- PROFILES: allow authenticated users to read basic profile info for assignments
-- (Needed for editor/team pickers across user & admin UI)
CREATE POLICY "profiles_authenticated_select_basic"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- SHOOT ASSIGNMENTS: allow authenticated users to read assignments
-- (Needed to render assigned members and to evaluate delete permission checks)
CREATE POLICY "shoot_assignments_authenticated_select"
ON public.shoot_assignments
FOR SELECT
TO authenticated
USING (true);

-- SHOOTS: allow all authenticated users to update (status/editing/editor assignment)
CREATE POLICY "shoots_authenticated_update"
ON public.shoots
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- SHOOTS: allow delete for creator OR assigned team member OR admin
CREATE POLICY "shoots_delete_creator_assigned_admin"
ON public.shoots
FOR DELETE
TO authenticated
USING (
  auth.uid() = created_by
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.shoot_assignments sa
    WHERE sa.shoot_id = shoots.id
      AND sa.user_id = auth.uid()
  )
);
