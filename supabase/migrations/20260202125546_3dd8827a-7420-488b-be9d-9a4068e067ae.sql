-- Create holidays table for custom holiday management
CREATE TABLE public.holidays (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    date date NOT NULL,
    description text,
    is_recurring boolean DEFAULT false,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(date)
);

-- Add comment for the table
COMMENT ON TABLE public.holidays IS 'Stores custom holidays configured by admins';
COMMENT ON COLUMN public.holidays.is_recurring IS 'If true, this holiday repeats every year on the same day/month';

-- Enable RLS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can insert holidays"
ON public.holidays
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update holidays"
ON public.holidays
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete holidays"
ON public.holidays
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- All authenticated users can view holidays
CREATE POLICY "Authenticated users can view holidays"
ON public.holidays
FOR SELECT
TO authenticated
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_holidays_updated_at
BEFORE UPDATE ON public.holidays
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();