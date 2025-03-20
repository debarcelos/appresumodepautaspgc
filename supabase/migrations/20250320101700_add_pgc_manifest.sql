-- Add pgc_manifest column to processes table
ALTER TABLE processes ADD COLUMN IF NOT EXISTS pgc_manifest TEXT;
