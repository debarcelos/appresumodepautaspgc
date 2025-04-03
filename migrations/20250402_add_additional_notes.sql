-- Adiciona a coluna additional_notes à tabela processes
ALTER TABLE processes
ADD COLUMN additional_notes TEXT;

-- Atualiza os registros existentes com valor padrão vazio
UPDATE processes
SET additional_notes = ''
WHERE additional_notes IS NULL;

-- Adiciona comentário à coluna para documentação
COMMENT ON COLUMN processes.additional_notes IS 'Campo para anotações adicionais do processo, com suporte a formatação rica';
