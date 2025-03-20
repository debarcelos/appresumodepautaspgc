/*
  # Update users table policies

  1. Changes
    - Add insert policy for authenticated users
    - Update read policy to allow authenticated users to read their own data
    - Add policy for public profiles

  2. Security
    - Maintains RLS on users table
    - Allows authenticated users to insert new users
    - Allows authenticated users to read their own data
    - Allows public read access to basic profile information
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new policies
CREATE POLICY "Enable insert for authenticated users"
ON users
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Public profiles are viewable"
ON users
FOR SELECT
USING (true);