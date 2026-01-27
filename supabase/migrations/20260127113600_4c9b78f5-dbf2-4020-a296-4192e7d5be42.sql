-- Create leave_balances table to track annual allocations per employee
CREATE TABLE public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  annual_allocation NUMERIC NOT NULL DEFAULT 18,
  carried_forward NUMERIC NOT NULL DEFAULT 0,
  used_leaves NUMERIC NOT NULL DEFAULT 0,
  pending_leaves NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, year)
);

-- Enable RLS
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all leave balances"
  ON public.leave_balances FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert leave balances"
  ON public.leave_balances FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update leave balances"
  ON public.leave_balances FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own leave balances"
  ON public.leave_balances FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_leave_balances_updated_at
  BEFORE UPDATE ON public.leave_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate used leaves from approved leave records
CREATE OR REPLACE FUNCTION public.calculate_leave_days(
  _leave_type TEXT,
  _start_date DATE,
  _end_date DATE
) RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _leave_type = 'half_day' THEN
    RETURN 0.5;
  ELSIF _leave_type = 'full_day' THEN
    RETURN 1;
  ELSIF _leave_type = 'multiple_days' THEN
    RETURN (_end_date - _start_date) + 1;
  ELSE
    RETURN 0;
  END IF;
END;
$$;

-- Function to sync leave balances based on approved leaves
CREATE OR REPLACE FUNCTION public.sync_leave_balance(_user_id UUID, _year INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _used NUMERIC;
  _pending NUMERIC;
BEGIN
  -- Calculate used leaves (approved)
  SELECT COALESCE(SUM(
    calculate_leave_days(leave_type::TEXT, start_date, end_date)
  ), 0) INTO _used
  FROM leaves
  WHERE user_id = _user_id
    AND status = 'approved'
    AND EXTRACT(YEAR FROM start_date) = _year;

  -- Calculate pending leaves
  SELECT COALESCE(SUM(
    calculate_leave_days(leave_type::TEXT, start_date, end_date)
  ), 0) INTO _pending
  FROM leaves
  WHERE user_id = _user_id
    AND status = 'pending'
    AND EXTRACT(YEAR FROM start_date) = _year;

  -- Insert or update balance
  INSERT INTO leave_balances (user_id, year, used_leaves, pending_leaves)
  VALUES (_user_id, _year, _used, _pending)
  ON CONFLICT (user_id, year) 
  DO UPDATE SET 
    used_leaves = _used,
    pending_leaves = _pending,
    updated_at = now();
END;
$$;