-- Apply pending migrations
-- From 20250320103500_add_order_to_processes.sql
ALTER TABLE processes ADD COLUMN IF NOT EXISTS "order" INTEGER;

-- From 20250324105934_add_pgc_modified_manifest.sql
ALTER TABLE processes 
  ADD COLUMN IF NOT EXISTS pgc_modified_manifest TEXT,
  ADD COLUMN IF NOT EXISTS is_pgc_modified BOOLEAN DEFAULT FALSE;
