-- Add new columns to salary_records table for checklist-based salary calculation
ALTER TABLE public.salary_records 
ADD COLUMN IF NOT EXISTS included_late boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS late_rule_type text, -- 'per_late', 'per_minute', 'slab_based'
ADD COLUMN IF NOT EXISTS late_rule_value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS late_arrivals_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_late_minutes integer DEFAULT 0,

ADD COLUMN IF NOT EXISTS included_overtime boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS overtime_hours numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS overtime_rate numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS overtime_amount numeric DEFAULT 0,

ADD COLUMN IF NOT EXISTS included_bonus boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bonus_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_note text,

ADD COLUMN IF NOT EXISTS included_custom_deduction boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_deduction_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS custom_deduction_note text,

ADD COLUMN IF NOT EXISTS month_year text; -- Format: 'Jan 2026'

-- Add unique constraint to prevent duplicate slips for same employee + month
ALTER TABLE public.salary_records 
ADD CONSTRAINT unique_employee_month UNIQUE (user_id, period_start, period_end);