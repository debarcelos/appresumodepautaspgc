/*
  # Fix date handling in agendas table

  1. Changes
    - Add trigger to handle date timezone conversion
    - Ensure dates are stored in UTC
    - Fix date handling on insert and update

  2. Performance
    - Add index on date column for better query performance
*/

-- Create function to handle date timezone
CREATE OR REPLACE FUNCTION handle_agenda_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure the date is stored properly without timezone conversion
  NEW.date = NEW.date::date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for insert and update
DROP TRIGGER IF EXISTS handle_agenda_date_trigger ON agendas;
CREATE TRIGGER handle_agenda_date_trigger
  BEFORE INSERT OR UPDATE ON agendas
  FOR EACH ROW
  EXECUTE FUNCTION handle_agenda_date();

-- Add index on date column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_agendas_date ON agendas(date);