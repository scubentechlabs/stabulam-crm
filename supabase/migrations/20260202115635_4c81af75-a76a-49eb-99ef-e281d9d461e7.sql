-- Update the calculate_leave_days function to exclude Sundays (working days are Mon-Sat)
CREATE OR REPLACE FUNCTION public.calculate_leave_days(_leave_type text, _start_date date, _end_date date)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _count numeric := 0;
  _current_date date;
BEGIN
  IF _leave_type = 'half_day' THEN
    RETURN 0.5;
  ELSIF _leave_type = 'full_day' THEN
    -- Check if the single day is a Sunday (0 = Sunday)
    IF EXTRACT(DOW FROM _start_date) = 0 THEN
      RETURN 0;
    END IF;
    RETURN 1;
  ELSIF _leave_type = 'multiple_days' THEN
    -- Count working days (Mon-Sat, excluding Sunday)
    _current_date := _start_date;
    WHILE _current_date <= _end_date LOOP
      -- DOW: 0 = Sunday, 1-6 = Mon-Sat
      IF EXTRACT(DOW FROM _current_date) != 0 THEN
        _count := _count + 1;
      END IF;
      _current_date := _current_date + 1;
    END LOOP;
    RETURN _count;
  ELSE
    RETURN 0;
  END IF;
END;
$function$;