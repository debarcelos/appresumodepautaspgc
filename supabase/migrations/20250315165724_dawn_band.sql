/*
  # Optimize database queries and add indexes

  1. Changes
    - Add composite indexes for better query performance
    - Add indexes for commonly filtered columns
    - Add partial index for finished agendas
    - Add B-tree indexes for text columns

  2. Performance
    - Optimize common query patterns
    - Improve sorting performance
    - Speed up relationship lookups
*/

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_agendas_user_date ON agendas(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_processes_agenda_created ON processes(agenda_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stakeholders_user_name ON stakeholders(user_id, name);

-- Add indexes for commonly filtered columns
CREATE INDEX IF NOT EXISTS idx_agendas_is_finished ON agendas(is_finished);
CREATE INDEX IF NOT EXISTS idx_processes_vote_type ON processes(vote_type);
CREATE INDEX IF NOT EXISTS idx_processes_process_type ON processes(process_type);

-- Add partial index for finished agendas
CREATE INDEX IF NOT EXISTS idx_agendas_finished ON agendas(date DESC) WHERE is_finished = true;

-- Add B-tree indexes for text search on commonly searched columns
CREATE INDEX IF NOT EXISTS idx_processes_counselor_name ON processes(counselor_name);
CREATE INDEX IF NOT EXISTS idx_processes_process_number ON processes(process_number);

-- Add indexes for stakeholder lookups
CREATE INDEX IF NOT EXISTS idx_stakeholders_name ON stakeholders(name);
CREATE INDEX IF NOT EXISTS idx_stakeholders_role ON stakeholders(role);