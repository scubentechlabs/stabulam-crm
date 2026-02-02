-- Create flag_status enum
CREATE TYPE public.flag_status AS ENUM ('open', 'acknowledged');

-- Create flags table
CREATE TABLE public.flags (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL,
    issued_by UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status flag_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flag_replies table
CREATE TABLE public.flag_replies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    flag_id UUID NOT NULL REFERENCES public.flags(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    reply_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flag_replies ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger for flags
CREATE TRIGGER update_flags_updated_at
    BEFORE UPDATE ON public.flags
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Flags RLS Policies
-- Admins can view all flags
CREATE POLICY "Admins can view all flags"
    ON public.flags FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert flags
CREATE POLICY "Admins can insert flags"
    ON public.flags FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update flags (for status changes only)
CREATE POLICY "Admins can update flags"
    ON public.flags FOR UPDATE
    USING (has_role(auth.uid(), 'admin'::app_role));

-- Employees can view their own flags
CREATE POLICY "Employees can view their own flags"
    ON public.flags FOR SELECT
    USING (auth.uid() = employee_id);

-- Flag Replies RLS Policies
-- Admins can view all replies
CREATE POLICY "Admins can view all flag replies"
    ON public.flag_replies FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));

-- Employees can view replies on their own flags
CREATE POLICY "Employees can view their own flag replies"
    ON public.flag_replies FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.flags 
            WHERE flags.id = flag_replies.flag_id 
            AND flags.employee_id = auth.uid()
        )
    );

-- Employees can insert replies on their own flags
CREATE POLICY "Employees can insert replies on their own flags"
    ON public.flag_replies FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.flags 
            WHERE flags.id = flag_replies.flag_id 
            AND flags.employee_id = auth.uid()
        )
    );

-- Admins can insert replies (comments on flags)
CREATE POLICY "Admins can insert flag replies"
    ON public.flag_replies FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_flags_employee_id ON public.flags(employee_id);
CREATE INDEX idx_flags_issued_by ON public.flags(issued_by);
CREATE INDEX idx_flags_created_at ON public.flags(created_at);
CREATE INDEX idx_flag_replies_flag_id ON public.flag_replies(flag_id);
CREATE INDEX idx_flag_replies_user_id ON public.flag_replies(user_id);