-- Add order column to processes table
ALTER TABLE processes ADD COLUMN IF NOT EXISTS "order" INTEGER;

-- Update existing records to have a default order
UPDATE processes SET "order" = 0 WHERE "order" IS NULL;

-- Make the column required for future records
ALTER TABLE processes ALTER COLUMN "order" SET NOT NULL;
ALTER TABLE processes ALTER COLUMN "order" SET DEFAULT 0;
