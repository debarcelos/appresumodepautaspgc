/*
  # Create stakeholders table with proper constraints and policies

  1. New Table
    - `stakeholders`
      - `id` (uuid, primary key)
      - `name` (text)
      - `role` (text) 
      - `email` (text with validation)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `user_id` (uuid, foreign key)

  2. Security
    - Enable RLS
    - Add policies for:
      - Public read access
      - Authenticated user CRUD operations
    - Email validation via CHECK constraint
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Enable read access for everyone" ON stakeholders;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON stakeholders;
    DROP POLICY IF EXISTS "Enable update for users based on user_id" ON stakeholders;
    DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON stakeholders;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create stakeholders table if it doesn't exist
DO $$ 
BEGIN
    CREATE TABLE IF NOT EXISTS stakeholders (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        role text NOT NULL,
        email text NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
    );
EXCEPTION
    WHEN duplicate_table THEN NULL;
END $$;

-- Enable Row Level Security
ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;

-- Create new policies
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

-- Create indexes if they don't exist
DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_stakeholders_user_id ON stakeholders(user_id);
    CREATE INDEX IF NOT EXISTS idx_stakeholders_email ON stakeholders(email);
EXCEPTION
    WHEN duplicate_table THEN NULL;
END $$;

-- Create updated_at trigger if it doesn't exist
DO $$
BEGIN
    CREATE TRIGGER update_stakeholders_updated_at
        BEFORE UPDATE ON stakeholders
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    ALTER TABLE stakeholders
        ADD CONSTRAINT unique_email_per_user UNIQUE (user_id, email);
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

-- Add table and column comments
COMMENT ON TABLE stakeholders IS 'Table storing stakeholders who can receive agenda notifications';
COMMENT ON COLUMN stakeholders.name IS 'Full name of the stakeholder';
COMMENT ON COLUMN stakeholders.role IS 'Role or position of the stakeholder';
COMMENT ON COLUMN stakeholders.email IS 'Email address for notifications';
COMMENT ON COLUMN stakeholders.user_id IS 'Reference to the user who created this stakeholder';