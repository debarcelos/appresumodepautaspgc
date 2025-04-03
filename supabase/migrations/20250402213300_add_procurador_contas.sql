-- Add procuradorContas column to processes table
ALTER TABLE processes
ADD COLUMN procurador_contas TEXT;

-- Update existing records to have an empty string as default
UPDATE processes
SET procurador_contas = ''
WHERE procurador_contas IS NULL;

-- Make the column required for future records
ALTER TABLE processes
ALTER COLUMN procurador_contas SET NOT NULL;
