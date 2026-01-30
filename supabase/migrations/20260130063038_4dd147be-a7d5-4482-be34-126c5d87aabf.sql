-- Add editor assignment fields to shoots table
ALTER TABLE public.shoots
ADD COLUMN editor_drive_link TEXT,
ADD COLUMN editor_description TEXT,
ADD COLUMN assigned_editor_id UUID,
ADD COLUMN editor_deadline DATE;

-- Add index for assigned editor lookups
CREATE INDEX idx_shoots_assigned_editor ON public.shoots(assigned_editor_id) WHERE assigned_editor_id IS NOT NULL;