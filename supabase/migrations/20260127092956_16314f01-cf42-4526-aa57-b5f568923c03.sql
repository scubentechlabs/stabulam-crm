-- Create app_role enum for role-based access
CREATE TYPE public.app_role AS ENUM ('admin', 'employee');

-- Create leave_type enum
CREATE TYPE public.leave_type AS ENUM ('half_day', 'full_day', 'multiple_days');

-- Create leave_status enum
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');

-- Create extra_work_status enum
CREATE TYPE public.extra_work_status AS ENUM ('pending', 'approved', 'rejected');

-- Create task_status enum
CREATE TYPE public.task_status AS ENUM ('pending', 'completed');

-- Create task_type enum
CREATE TYPE public.task_type AS ENUM ('tod', 'urgent_tod');

-- Create shoot_status enum
CREATE TYPE public.shoot_status AS ENUM ('pending', 'in_progress', 'completed');

-- Create notification_type enum
CREATE TYPE public.notification_type AS ENUM ('leave_request', 'extra_work_request', 'request_approved', 'request_rejected', 'shoot_reminder', 'missing_tod', 'missing_eod', 'salary_generated');

-- Create salary_cycle_type enum
CREATE TYPE public.salary_cycle_type AS ENUM ('monthly', 'bi_weekly', 'custom');

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    mobile TEXT,
    monthly_salary DECIMAL(12, 2) DEFAULT 0,
    work_start_time TIME DEFAULT '09:00:00',
    work_end_time TIME DEFAULT '18:00:00',
    department TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- USER ROLES TABLE (Separate from profiles for security)
-- ============================================
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'employee',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- ============================================
-- ATTENDANCE TABLE
-- ============================================
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    clock_in_time TIMESTAMP WITH TIME ZONE,
    clock_out_time TIMESTAMP WITH TIME ZONE,
    clock_in_photo_url TEXT,
    clock_in_location JSONB,
    late_minutes INTEGER DEFAULT 0,
    is_late BOOLEAN DEFAULT false,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    tod_submitted BOOLEAN DEFAULT false,
    eod_submitted BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, date)
);

-- ============================================
-- TASKS TABLE (TOD/Urgent TOD/EOD)
-- ============================================
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    attendance_id UUID REFERENCES public.attendance(id) ON DELETE CASCADE,
    task_type task_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'pending',
    pending_reason TEXT,
    is_edited BOOLEAN DEFAULT false,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- LEAVES TABLE
-- ============================================
CREATE TABLE public.leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    half_day_period TEXT CHECK (half_day_period IN ('morning', 'afternoon')),
    delegation_notes TEXT NOT NULL,
    reason TEXT,
    status leave_status DEFAULT 'pending',
    admin_comments TEXT,
    approved_by UUID REFERENCES auth.users(id),
    has_advance_notice BOOLEAN DEFAULT false,
    penalty_amount DECIMAL(10, 2) DEFAULT 0,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- EXTRA WORK TABLE
-- ============================================
CREATE TABLE public.extra_work (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    attendance_id UUID REFERENCES public.attendance(id) ON DELETE CASCADE,
    hours INTEGER NOT NULL CHECK (hours >= 1 AND hours <= 4),
    task_description TEXT NOT NULL,
    notes TEXT,
    status extra_work_status DEFAULT 'pending',
    admin_comments TEXT,
    approved_by UUID REFERENCES auth.users(id),
    compensation_amount DECIMAL(10, 2) DEFAULT 0,
    work_date DATE NOT NULL DEFAULT CURRENT_DATE,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- SHOOTS TABLE
-- ============================================
CREATE TABLE public.shoots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    brand_name TEXT NOT NULL,
    event_name TEXT NOT NULL,
    shoot_date DATE NOT NULL,
    shoot_time TIME NOT NULL,
    location TEXT NOT NULL,
    location_coordinates JSONB,
    brief TEXT,
    status shoot_status DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- SHOOT ASSIGNMENTS TABLE (Many-to-Many)
-- ============================================
CREATE TABLE public.shoot_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shoot_id UUID REFERENCES public.shoots(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (shoot_id, user_id)
);

-- ============================================
-- RULES CONFIGURATION TABLE
-- ============================================
CREATE TABLE public.rules_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_key TEXT UNIQUE NOT NULL,
    rule_value JSONB NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT true,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    notification_type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    reference_id UUID,
    reference_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- SALARY RECORDS TABLE
-- ============================================
CREATE TABLE public.salary_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    base_salary DECIMAL(12, 2) NOT NULL,
    late_deductions DECIMAL(10, 2) DEFAULT 0,
    leave_deductions DECIMAL(10, 2) DEFAULT 0,
    leave_penalties DECIMAL(10, 2) DEFAULT 0,
    tod_penalties DECIMAL(10, 2) DEFAULT 0,
    eod_penalties DECIMAL(10, 2) DEFAULT 0,
    extra_work_additions DECIMAL(10, 2) DEFAULT 0,
    other_deductions DECIMAL(10, 2) DEFAULT 0,
    other_additions DECIMAL(10, 2) DEFAULT 0,
    net_salary DECIMAL(12, 2) NOT NULL,
    breakdown JSONB,
    is_finalized BOOLEAN DEFAULT false,
    generated_by UUID REFERENCES auth.users(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, period_start, period_end)
);

-- ============================================
-- SALARY CYCLE SETTINGS TABLE
-- ============================================
CREATE TABLE public.salary_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_type salary_cycle_type DEFAULT 'monthly',
    custom_start_day INTEGER DEFAULT 1,
    custom_end_day INTEGER DEFAULT 31,
    working_days_per_month INTEGER DEFAULT 26,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shoots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shoot_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY DEFINER FUNCTION FOR ROLE CHECK
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- ============================================
-- FUNCTION TO GET USER ROLE
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.user_roles
    WHERE user_id = _user_id
    LIMIT 1
$$;

-- ============================================
-- RLS POLICIES FOR PROFILES
-- ============================================
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert profiles"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- ============================================
-- RLS POLICIES FOR USER ROLES
-- ============================================
CREATE POLICY "Users can view their own role"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
    ON public.user_roles FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
    ON public.user_roles FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
    ON public.user_roles FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES FOR ATTENDANCE
-- ============================================
CREATE POLICY "Users can view their own attendance"
    ON public.attendance FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all attendance"
    ON public.attendance FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own attendance"
    ON public.attendance FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance"
    ON public.attendance FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all attendance"
    ON public.attendance FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES FOR TASKS
-- ============================================
CREATE POLICY "Users can view their own tasks"
    ON public.tasks FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tasks"
    ON public.tasks FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own tasks"
    ON public.tasks FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
    ON public.tasks FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES FOR LEAVES
-- ============================================
CREATE POLICY "Users can view their own leaves"
    ON public.leaves FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all leaves"
    ON public.leaves FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own leaves"
    ON public.leaves FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending leaves"
    ON public.leaves FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can update all leaves"
    ON public.leaves FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES FOR EXTRA WORK
-- ============================================
CREATE POLICY "Users can view their own extra work"
    ON public.extra_work FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all extra work"
    ON public.extra_work FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own extra work"
    ON public.extra_work FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending extra work"
    ON public.extra_work FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can update all extra work"
    ON public.extra_work FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES FOR SHOOTS
-- ============================================
CREATE POLICY "Authenticated users can view all shoots"
    ON public.shoots FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert shoots"
    ON public.shoots FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update their own shoots or admins can update all"
    ON public.shoots FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete shoots"
    ON public.shoots FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES FOR SHOOT ASSIGNMENTS
-- ============================================
CREATE POLICY "Authenticated users can view all shoot assignments"
    ON public.shoot_assignments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert shoot assignments"
    ON public.shoot_assignments FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Admins can delete shoot assignments"
    ON public.shoot_assignments FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES FOR RULES CONFIG
-- ============================================
CREATE POLICY "Authenticated users can view rules"
    ON public.rules_config FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can insert rules"
    ON public.rules_config FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update rules"
    ON public.rules_config FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES FOR NOTIFICATIONS
-- ============================================
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================
-- RLS POLICIES FOR SALARY RECORDS
-- ============================================
CREATE POLICY "Users can view their own salary records"
    ON public.salary_records FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all salary records"
    ON public.salary_records FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert salary records"
    ON public.salary_records FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update salary records"
    ON public.salary_records FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES FOR SALARY SETTINGS
-- ============================================
CREATE POLICY "Authenticated users can view salary settings"
    ON public.salary_settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can insert salary settings"
    ON public.salary_settings FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update salary settings"
    ON public.salary_settings FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- CREATE STORAGE BUCKET FOR ATTENDANCE PHOTOS
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('attendance-photos', 'attendance-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for attendance photos
CREATE POLICY "Users can upload their own attendance photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'attendance-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own attendance photos"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'attendance-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all attendance photos"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'attendance-photos' AND public.has_role(auth.uid(), 'admin'));

-- ============================================
-- TRIGGER FOR UPDATING updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON public.attendance
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leaves_updated_at
    BEFORE UPDATE ON public.leaves
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_extra_work_updated_at
    BEFORE UPDATE ON public.extra_work
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shoots_updated_at
    BEFORE UPDATE ON public.shoots
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rules_config_updated_at
    BEFORE UPDATE ON public.rules_config
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_salary_records_updated_at
    BEFORE UPDATE ON public.salary_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_salary_settings_updated_at
    BEFORE UPDATE ON public.salary_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TRIGGER TO CREATE PROFILE ON USER SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email
    );
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'employee');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- INSERT DEFAULT RULES
-- ============================================
INSERT INTO public.rules_config (rule_key, rule_value, description) VALUES
('late_policy', '{"tiers": [{"min_minutes": 1, "max_minutes": 30, "deduction": 100}, {"min_minutes": 31, "max_minutes": 60, "deduction": 200}, {"min_minutes": 61, "max_minutes": 90, "deduction_type": "half_day"}, {"min_minutes": 91, "max_minutes": null, "deduction_type": "full_day"}]}', 'Late arrival deduction tiers'),
('leave_policy', '{"advance_notice_hours": 48, "penalty_without_notice": 250, "half_day_with_notice_deduction": 250}', 'Leave policy rules'),
('reporting_policy', '{"missing_tod_penalty": 100, "missing_eod_penalty": 100}', 'Daily reporting penalties'),
('extra_work_policy', '{"tiers": [{"hours": 1, "compensation": 150}, {"hours": 2, "compensation": 250}, {"hours": 3, "compensation": 350}, {"hours": 4, "compensation": 450}]}', 'Extra work compensation tiers'),
('working_days', '{"days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"], "holidays": []}', 'Working days configuration')
ON CONFLICT (rule_key) DO NOTHING;

-- Insert default salary settings
INSERT INTO public.salary_settings (cycle_type, custom_start_day, custom_end_day, working_days_per_month)
VALUES ('monthly', 1, 31, 26)
ON CONFLICT DO NOTHING;