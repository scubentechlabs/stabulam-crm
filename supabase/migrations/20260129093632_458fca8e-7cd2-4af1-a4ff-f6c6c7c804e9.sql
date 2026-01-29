-- Add 'given_by_editor' to the shoot_status enum
ALTER TYPE public.shoot_status ADD VALUE IF NOT EXISTS 'given_by_editor';