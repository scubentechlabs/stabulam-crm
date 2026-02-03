-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can update their own pending leaves" ON public.leaves;

-- Create a new policy that allows users to update their own pending leaves
-- The USING clause checks the OLD row (must be pending and owned by user)
-- The WITH CHECK clause allows the update to set status to rejected (for cancellation)
CREATE POLICY "Users can update their own pending leaves"
ON public.leaves
FOR UPDATE
USING (
  (auth.uid() = user_id) AND (status = 'pending'::leave_status)
)
WITH CHECK (
  (auth.uid() = user_id) AND (status IN ('pending'::leave_status, 'rejected'::leave_status))
);