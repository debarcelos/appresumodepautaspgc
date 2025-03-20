-- Add order column to processes table
ALTER TABLE processes ADD COLUMN IF NOT EXISTS "order" INTEGER;
