/*
  # Create stakeholders table

  1. New Tables
    - `stakeholders`
      - `id` (uuid, primary key) - unique identifier
      - `name` (text) - stakeholder's name
      - `role` (text) - stakeholder's role/position
      - `email` (text) - stakeholder's email address
      - `created_at` (timestamptz) - timestamp of creation
      - `updated_at` (timestamptz) - timestamp of last update
      - `user_id` (uuid) - reference to the user who created the stakeholder

  2. Security
    - Enable RLS on stakeholders table
    - Add policies for:
      - Public read access
      - Authenticated users can manage their own stakeholders
    - Add indexes for performance
    - Add trigger for updated_at
*/

-- Create stakeholders table
CREATE TABLE IF NOT EXISTS stakeholders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  email text NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for everyone"
  ON stakeholders FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON stakeholders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id"
  ON stakeholders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id"
  ON stakeholders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stakeholders_user_id ON stakeholders(user_id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_email ON stakeholders(email);

-- Create updated_at trigger
CREATE TRIGGER update_stakeholders_updated_at
  BEFORE UPDATE ON stakeholders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add unique constraint for email per user
ALTER TABLE stakeholders
  ADD CONSTRAINT unique_email_per_user UNIQUE (user_id, email);

COMMENT ON TABLE stakeholders IS 'Table storing stakeholders who can receive agenda notifications';
COMMENT ON COLUMN stakeholders.name IS 'Full name of the stakeholder';
COMMENT ON COLUMN stakeholders.role IS 'Role or position of the stakeholder';
COMMENT ON COLUMN stakeholders.email IS 'Email address for notifications';
COMMENT ON COLUMN stakeholders.user_id IS 'Reference to the user who created this stakeholder';