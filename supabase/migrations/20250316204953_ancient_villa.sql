/*
  # Update RLS policies to allow any authenticated user to manage data

  1. Changes
    - Drop existing restrictive policies
    - Create new permissive policies for authenticated users
    - Maintain public read access
    - Remove user_id checks from policies

  2. Security
    - Maintains RLS on all tables
    - Allows any authenticated user to manage any data
    - Maintains public read access for transparency
*/

-- Drop existing policies for agendas
DROP POLICY IF EXISTS "Enable read access for everyone" ON agendas;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON agendas;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON agendas;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON agendas;

-- Create new policies for agendas
CREATE POLICY "Enable read access for everyone"
  ON agendas FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON agendas FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON agendas FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON agendas FOR DELETE
  TO authenticated
  USING (true);

-- Drop existing policies for processes
DROP POLICY IF EXISTS "Anyone can read processes" ON processes;
DROP POLICY IF EXISTS "Authenticated users can manage processes" ON processes;

-- Create new policies for processes
CREATE POLICY "Enable read access for everyone"
  ON processes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON processes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON processes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON processes FOR DELETE
  TO authenticated
  USING (true);

-- Drop existing policies for stakeholders
DROP POLICY IF EXISTS "Enable read access for everyone" ON stakeholders;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON stakeholders;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON stakeholders;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON stakeholders;

-- Create new policies for stakeholders
CREATE POLICY "Enable read access for everyone"
  ON stakeholders FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON stakeholders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON stakeholders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON stakeholders FOR DELETE
  TO authenticated
  USING (true);