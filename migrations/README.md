# Migrações do Banco de Dados

Este diretório contém os scripts SQL para migrações do banco de dados.

## Última Migração: Adicionar Campo de Anotações Adicionais

### Arquivo: 20250402_add_additional_notes.sql

Para aplicar esta migração no Supabase:

1. Acesse o painel de controle do Supabase (https://app.supabase.com)
2. Selecione seu projeto
3. Vá para "Database" > "SQL Editor"
4. Clique em "New Query"
5. Cole o conteúdo do arquivo `20250402_add_additional_notes.sql`
6. Clique em "Run" para executar a migração

### Alterações:
- Adicionada nova coluna `additional_notes` do tipo TEXT à tabela `processes`
- Atualizado registros existentes com valor padrão vazio
- Adicionado comentário de documentação à coluna

### Verificação:
Após aplicar a migração, você pode verificar se ela foi aplicada corretamente executando:

```sql
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'processes' AND column_name = 'additional_notes';
```

Você deve ver uma linha indicando que a coluna `additional_notes` foi criada com tipo `text`.
