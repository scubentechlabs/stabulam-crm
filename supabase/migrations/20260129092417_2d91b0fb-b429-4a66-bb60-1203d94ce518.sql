-- Create enum for editing workflow status
CREATE TYPE public.editing_status AS ENUM (
  'not_started',
  'editing',
  'internal_review',
  'sent_to_client',
  'revisions_round',
  'final_delivered'
);

-- Add editing_status column to shoots table
ALTER TABLE public.shoots
ADD COLUMN editing_status public.editing_status DEFAULT 'not_started';