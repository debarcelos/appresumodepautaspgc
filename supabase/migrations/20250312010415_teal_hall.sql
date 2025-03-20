/*
  # Initial database schema setup

  1. Authentication Schema
    - Enable auth schema and extensions
    - Set up auth tables and functions

  2. Application Tables
    - users (linked to auth.users)
    - agendas
    - processes

  3. Security
    - Enable RLS on all tables
    - Set up appropriate policies
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing policies if they exist
DO $$ 
BEGIN
    -- Drop users policies
    DROP POLICY IF EXISTS "Users can read own data" ON users;
    DROP POLICY IF EXISTS "Users can update own data" ON users;
    DROP POLICY IF EXISTS "Enable user registration" ON users;
    DROP POLICY IF EXISTS "Public profiles are viewable" ON users;
    DROP POLICY IF EXISTS "Allow reading email for authentication" ON users;
    
    -- Drop agendas policies
    DROP POLICY IF EXISTS "Anyone can read agendas" ON agendas;
    DROP POLICY IF EXISTS "Authenticated users can insert agendas" ON agendas;
    DROP POLICY IF EXISTS "Users can update own agendas" ON agendas;
    DROP POLICY IF EXISTS "Users can delete own agendas" ON agendas;
    DROP POLICY IF EXISTS "Authenticated users can manage agendas" ON agendas;
    
    -- Drop processes policies
    DROP POLICY IF EXISTS "Anyone can read processes" ON processes;
    DROP POLICY IF EXISTS "Authenticated users can insert processes" ON processes;
    DROP POLICY IF EXISTS "Users can update own processes" ON processes;
    DROP POLICY IF EXISTS "Users can delete own processes" ON processes;
    DROP POLICY IF EXISTS "Authenticated users can manage processes" ON processes;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS processes;
DROP TABLE IF EXISTS agendas;
DROP TABLE IF EXISTS users;

-- Create users table linked to auth.users
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL,
  registration text NOT NULL,
  token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agendas table
CREATE TABLE agendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  number text NOT NULL,
  date date NOT NULL,
  is_finished boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create processes table
CREATE TABLE processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id uuid REFERENCES agendas(id) ON DELETE CASCADE,
  counselor_name text NOT NULL,
  process_number text NOT NULL,
  process_type text NOT NULL,
  stakeholders text NOT NULL,
  summary text NOT NULL,
  vote_type text NOT NULL,
  mpc_opinion_summary text,
  tce_report_summary text NOT NULL,
  has_view_vote boolean DEFAULT false,
  view_vote_summary text,
  mpc_system_manifest text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agendas_updated_at
    BEFORE UPDATE ON agendas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processes_updated_at
    BEFORE UPDATE ON processes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, registration, token)
  VALUES (new.id, new.email, '', '', '', '')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create policies for users table
CREATE POLICY "Enable user registration"
  ON users
  FOR INSERT
  TO authenticated, anon
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
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow reading email for authentication"
  ON users
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create policies for agendas table
CREATE POLICY "Anyone can read agendas"
  ON agendas
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage agendas"
  ON agendas
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for processes table
CREATE POLICY "Anyone can read processes"
  ON processes
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage processes"
  ON processes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agendas_user_id ON agendas(user_id);
CREATE INDEX IF NOT EXISTS idx_processes_agenda_id ON processes(agenda_id);
CREATE INDEX IF NOT EXISTS idx_processes_user_id ON processes(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);