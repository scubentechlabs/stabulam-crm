-- Create table for notification preferences
CREATE TABLE public.notification_preferences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    leave_notifications BOOLEAN NOT NULL DEFAULT true,
    extra_work_notifications BOOLEAN NOT NULL DEFAULT true,
    shoot_notifications BOOLEAN NOT NULL DEFAULT true,
    task_notifications BOOLEAN NOT NULL DEFAULT true,
    salary_notifications BOOLEAN NOT NULL DEFAULT true,
    push_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own preferences
CREATE POLICY "Users can view their own preferences"
ON public.notification_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON public.notification_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.notification_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get or create preferences for a user
CREATE OR REPLACE FUNCTION public.get_or_create_notification_preferences(_user_id UUID)
RETURNS notification_preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result notification_preferences;
BEGIN
    -- Try to get existing preferences
    SELECT * INTO result FROM notification_preferences WHERE user_id = _user_id;
    
    -- If not found, create default preferences
    IF result IS NULL THEN
        INSERT INTO notification_preferences (user_id)
        VALUES (_user_id)
        RETURNING * INTO result;
    END IF;
    
    RETURN result;
END;
$$;