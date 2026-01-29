-- Add policy to allow all authenticated users to view basic profile info for team assignments
CREATE POLICY "Authenticated users can view profiles for team assignment" 
ON public.profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');