/*
  # Fix agenda table policies

  1. Changes
    - Drop existing policies for agendas table
    - Create new, more permissive policies for authenticated users
    - Simplify policy conditions

  2. Security
    - Maintains RLS on agendas table
    - Allows authenticated users to perform all operations on their own agendas
    - Maintains public read access
*/

-- Drop existing policies for agendas table
DROP POLICY IF EXISTS "Anyone can read agendas" ON agendas;
DROP POLICY IF EXISTS "Authenticated users can manage agendas" ON agendas;

-- Create new policies
CREATE POLICY "Enable read access for everyone"
  ON agendas FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON agendas FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for users based on user_id"
  ON agendas FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id"
  ON agendas FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);