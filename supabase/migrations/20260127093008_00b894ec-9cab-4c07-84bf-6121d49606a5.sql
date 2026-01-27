-- Fix security warnings by updating permissive RLS policies

-- Drop and recreate the overly permissive policies for shoots
DROP POLICY IF EXISTS "Authenticated users can insert shoots" ON public.shoots;
CREATE POLICY "Authenticated users can insert shoots"
    ON public.shoots FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Drop and recreate the overly permissive policies for shoot_assignments  
DROP POLICY IF EXISTS "Authenticated users can insert shoot assignments" ON public.shoot_assignments;
CREATE POLICY "Authenticated users can insert shoot assignments"
    ON public.shoot_assignments FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.shoots 
            WHERE id = shoot_id 
            AND (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
        )
    );

-- Drop and recreate the overly permissive notifications insert policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Fix function search path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;