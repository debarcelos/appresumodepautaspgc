# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [Não lançado]

### Adicionado
- Novo campo "Observações" no formulário de edição de processos:
  - Campo de texto longo com formatação rica (editor de texto avançado)
  - Posicionado após o campo "Tipo de Voto" e antes do campo "Procurador de Contas"
  - Suporte a formatação avançada como negrito, itálico, listas e tabelas
  - Armazenado na nova coluna "observations" no banco de dados
- Novo sistema de filtros na página de processos:
  - Tipo de Sessão (Ordinária ou Extraordinária Administrativa)
  - Número da Pauta (lista dinâmica com todas as pautas cadastradas)
  - Conselheiro (lista predefinida)
  - Procurador de Contas (lista predefinida)
  - Número do Processo
  - Tipo de Processo (lista dinâmica com todos os tipos cadastrados)
  - Tipo de Voto (lista dinâmica com todos os tipos cadastrados)
  - Teve Voto Vista (Sim/Não)
- Campo "Procurador de Contas" no formulário de edição de processo:
  - Campo estilo dropdown com lista predefinida
  - Obrigatório apenas para sessões do tipo "Ordinária"
  - Limpa automaticamente ao mudar de sessão Ordinária para outro tipo
- Campo "Tipo de Sessão" simplificado:
  - Apenas duas opções: "Ordinária" e "Extraordinária Administrativa"
  - Mesmo padrão usado no filtro e no formulário de edição
  - Validações específicas para cada tipo

### Alterado
- Reorganização do formulário de edição de processos:
  - Campo "Procurador de Contas" movido para aparecer entre "Observações" e "Parecer do MPC"
  - Melhorada a ordem lógica dos campos para um preenchimento mais intuitivo
- Interface da tabela de processos aprimorada:
  - Nova coluna "Procurador" adicionada para exibir informações do procurador de contas responsável
  - Dados nas colunas "Procurador" e "Tipo de Voto" agora aparecem em letras maiúsculas
  - Ajustada a largura das colunas para melhor visualização
  - Layout responsivo similar à página "Pautas", adaptando-se corretamente a dispositivos móveis e desktop
- Filtros dinâmicos agora mostram apenas valores existentes no banco:
  - Número da Pauta: apenas pautas já cadastradas
  - Tipo de Processo: apenas tipos em uso
  - Tipo de Voto: apenas votos já utilizados
- Validações de formulário aprimoradas:
  - Regras específicas para cada tipo de sessão
  - Melhor feedback visual de campos obrigatórios
  - Limpeza automática de campos relacionados
- Interface de exportação de pautas:
  - Removida opção de exportação para PDF
  - Adicionado seletor de formato (Word/Excel)
  - Melhorada organização dos botões de exportação
- Melhorada a formatação do documento Word exportado:
  - Removido espaçamento entre títulos e conteúdo subsequente
  - Mantido espaçamento adequado entre diferentes seções
  - Títulos configurados como Arial 12pt negrito (headings)
  - Conteúdo configurado como Arial 11pt normal
  - Sumário aprimorado com agrupamento por conselheiro e links para processos
  - Corrigidos nomes dos campos para manter consistência com a aplicação:
    - Campo "Manifestação do Sistema do MPC" renomeado para "Proposta de manifestação do MPC"
    - Campo "Tipo" renomeado para "Tipo de Processo"
- Página de configurações:
  - Campos "Ementa" e "Resumo" não usam mais editor rico (TinyMCE)
  - Melhorada performance de salvamento

### Corrigido
- Posição de processos:
  - Processos agora são sempre exibidos em ordem crescente de posição
  - Corrigido bug onde a posição do processo não era salva corretamente ao adicionar um novo processo
  - Campo "order" não é mais NULL por padrão
- Botão "Adicionar Processo" agora aparece corretamente quando não há processos na pauta
- Comportamento do campo "Tipo de Voto" no formulário de edição de processos:
  - Corrigido problema onde selecionar um "Procurador de Contas" limpava o "Tipo de Voto"
  - Melhorada a sincronização de estado entre os campos do formulário
  - Preservação adequada do campo "Parecer do MPC" ao alterar outros campos do formulário

## [1.6.0] - 2025-04-03

### Adicionado
- Campo "Procurador de Contas" no formulário de edição de processo:
  - Lista predefinida com os procuradores disponíveis
  - Salvo no banco de dados na coluna `procurador_contas`
  - Verificação de compatibilidade com o Supabase implementada
- Filtro por Procurador de Contas nos filtros avançados:
  - Substituído o filtro "Manifestação do MPC" por filtro de Procurador
  - Lista dropdown com os mesmos procuradores do formulário de edição
  - Verificação de compatibilidade com processos que não tenham procurador definido
- Funcionalidade de renumeração de processos após exclusão:
  - Ao excluir um processo, o sistema pergunta se o usuário deseja renumerar
  - Se confirmado, todos os processos subsequentes têm sua posição reduzida em 1
  - Atualização automática da posição no banco de dados e na interface

### Melhorado
- Preservação de conteúdo nos campos de texto rico:
  - Os textos nos campos "Relatório/Voto TCE", "Voto Vista" e "Proposta MPC" agora são preservados
  - Conteúdo mantido mesmo ao alternar visibilidade dos campos via checkboxes
  - Estados independentes para cada campo de texto
- Ordenação consistente de processos:
  - Processos são ordenados por agenda (mais recente primeiro) e depois por posição
  - Garantia de ordenação correta após adição, edição ou exclusão de processos
  - Recarregamento automático dos dados após alterações para manter consistência

### Corrigido
- Problemas com campos de dropdown:
  - Dropdown de Procurador de Contas agora mantém valor selecionado
  - Tratamento adequado para processos sem procurador definido
  - Prevenção de erros ao filtrar por procurador quando o campo está vazio

## [1.5.0] - 2025-04-03
{{ ... }}
