-- Migration: safely add 'shop' and 'restaurant' labels to public.app_role
-- Generated: 2025-10-11

-- This migration is idempotent: it checks whether the enum values already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'app_role' AND e.enumlabel = 'shop'
    ) THEN
        ALTER TYPE public.app_role ADD VALUE 'shop';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'app_role' AND e.enumlabel = 'restaurant'
    ) THEN
        ALTER TYPE public.app_role ADD VALUE 'restaurant';
    END IF;
END$$;
