-- Create enum for regularization status
CREATE TYPE public.regularization_status AS ENUM ('pending', 'approved', 'rejected');

-- Create attendance regularizations table
CREATE TABLE public.attendance_regularizations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    request_date DATE NOT NULL,
    requested_clock_in TIME NOT NULL,
    requested_clock_out TIME NOT NULL,
    reason TEXT NOT NULL,
    status regularization_status NOT NULL DEFAULT 'pending',
    admin_comments TEXT,
    approved_by UUID,
    processed_at TIMESTAMP WITH TIME ZONE,
    attendance_id UUID REFERENCES public.attendance(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attendance_regularizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own regularizations"
ON public.attendance_regularizations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own regularizations"
ON public.attendance_regularizations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all regularizations"
ON public.attendance_regularizations FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all regularizations"
ON public.attendance_regularizations FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_attendance_regularizations_updated_at
BEFORE UPDATE ON public.attendance_regularizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add to notification types
ALTER TYPE public.notification_type ADD VALUE 'regularization_request';
ALTER TYPE public.notification_type ADD VALUE 'regularization_approved';
ALTER TYPE public.notification_type ADD VALUE 'regularization_rejected';