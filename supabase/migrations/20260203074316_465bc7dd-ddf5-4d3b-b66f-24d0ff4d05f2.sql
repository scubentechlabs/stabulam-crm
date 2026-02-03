-- Fix flag_replies RLS policies: change from RESTRICTIVE to PERMISSIVE
-- RESTRICTIVE policies require ALL to pass (AND logic)
-- PERMISSIVE policies require ANY to pass (OR logic)

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view all flag replies" ON public.flag_replies;
DROP POLICY IF EXISTS "Employees can view their own flag replies" ON public.flag_replies;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can view all flag replies"
ON public.flag_replies
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can view their own flag replies"
ON public.flag_replies
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.flags 
  WHERE flags.id = flag_replies.flag_id 
  AND flags.employee_id = auth.uid()
));