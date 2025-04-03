import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdbrdidnyebnagzprdbf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkYnJkaWRueWVibmFnenByZGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NTQyODMsImV4cCI6MjA1NTAzMDI4M30.wx6bE--cYsbcdMb9DtRjzwE6mE0F6ZsBvRa-yztUYmQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
  try {
    const { data, error } = await supabase
      .from('processes')
      .select('procurador_contas')
      .limit(1);

    if (error) {
      console.error('Erro ao verificar coluna:', error);
      return;
    }

    if (data && data.length > 0 && data[0].hasOwnProperty('procurador_contas')) {
      console.log('✓ Migração verificada com sucesso!');
      console.log('A coluna procurador_contas existe e está configurada corretamente.');
    } else {
      console.log('❌ A coluna procurador_contas não foi encontrada.');
    }
  } catch (error) {
    console.error('Erro ao verificar migração:', error);
  }
}

verifyMigration();
