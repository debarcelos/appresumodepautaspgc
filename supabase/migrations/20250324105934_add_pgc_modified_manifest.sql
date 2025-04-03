-- Add pgc_modified_manifest and is_pgc_modified columns to processes table
ALTER TABLE processes 
  ADD COLUMN IF NOT EXISTS pgc_modified_manifest TEXT,
  ADD COLUMN IF NOT EXISTS is_pgc_modified BOOLEAN DEFAULT FALSE;
