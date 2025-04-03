import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Por favor, configure as variáveis de ambiente no arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyMigration() {
  console.log('Aplicando migração para adicionar coluna de observações...');

  try {
    const { error } = await supabase.rpc('apply_migration', {
      migration_name: '20250403111946_add_observations_column'
    });

    if (error) {
      console.error('Erro ao aplicar migração:', error);
      return;
    }

    console.log('✓ Migração aplicada com sucesso!');
    console.log('A coluna observations foi adicionada à tabela processes.');
  } catch (error) {
    console.error('Erro ao aplicar migração:', error);
  }
}

applyMigration();
