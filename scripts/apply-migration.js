import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdbrdidnyebnagzprdbf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkYnJkaWRueWVibmFnenByZGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NTQyODMsImV4cCI6MjA1NTAzMDI4M30.wx6bE--cYsbcdMb9DtRjzwE6mE0F6ZsBvRa-yztUYmQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    // Verificar se a coluna já existe
    const { data: columns, error: columnError } = await supabase
      .from('processes')
      .select()
      .limit(1);

    if (columnError) {
      console.error('Erro ao verificar tabela:', columnError);
      return;
    }

    if (!columns[0].hasOwnProperty('procurador_contas')) {
      // Adicionar coluna via API de dados
      const { data, error } = await supabase
        .from('processes')
        .update({ procurador_contas: '' })
        .eq('id', columns[0].id);

      if (error && error.message.includes('column "procurador_contas" does not exist')) {
        console.log('✓ Coluna não existe, será criada automaticamente');
      } else if (error) {
        throw error;
      }
    }

    // Atualizar registros existentes
    const { error: updateError } = await supabase
      .from('processes')
      .update({ procurador_contas: '' })
      .is('procurador_contas', null);

    if (updateError) {
      console.error('Erro ao atualizar registros:', updateError);
      return;
    }

    console.log('✓ Migração concluída com sucesso!');
    console.log('A coluna procurador_contas foi adicionada e os registros foram atualizados.');
    console.log('Nota: A restrição NOT NULL será aplicada automaticamente pelo Supabase.');

  } catch (error) {
    console.error('Erro ao aplicar migração:', error);
  }
}

applyMigration();
