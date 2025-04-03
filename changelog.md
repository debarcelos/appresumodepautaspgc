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
- Página de configurações:
  - Campos "Ementa" e "Resumo" não usam mais editor rico (TinyMCE)
  - Melhorada performance de salvamento

### Corrigido
- Posição de processos:
  - Processos agora são sempre exibidos em ordem crescente de posição
  - Corrigido bug onde a posição do processo não era salva corretamente ao adicionar um novo processo
  - Campo "order" não é mais NULL por padrão
- Botão "Adicionar Processo" agora aparece corretamente quando não há processos na pauta

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

### Adicionado
- Filtros avançados na página de processos:
  - Filtrar por pauta, número, conselheiro, tipo, tipo de voto
  - Filtrar por presença de voto vista
  - Busca em interessados, ementa e manifestação do MPC
  - Interface responsiva com opção de exibir/ocultar filtros

### Corrigido
- Importação de planilhas Excel:
  - Implementado método robusto para leitura de diferentes formatos de planilhas
  - Processamento manual das células para maior compatibilidade
  - Tratamento de erros melhorado com mensagens específicas
  - Removida dependência da coluna `additional_notes` que não existe no banco de dados

## [1.4.0] - 2025-04-02

### Adicionado
- Novo campo "Anotações Adicionais":
  - Campo de texto longo com formatação rica
  - Localizado entre "Tipo de Voto" e "Parecer do MPC"
  - Não obrigatório
  - Suporte completo ao editor de texto rico
  - Nova coluna `additional_notes` adicionada à tabela `processes` no Supabase
  - Script de migração disponível em `migrations/20250402_add_additional_notes.sql`

### Alterado
- Processos agora são exibidos sempre em ordem crescente de posição na página "Processos"
- Corrigido problema onde a posição do processo não era salva corretamente ao adicionar um novo processo
- Melhorada tipagem TypeScript para maior segurança e consistência do código

## [1.3.0] - 2025-03-25

### Adicionado
- Novas colunas no banco de dados: order, is_pgc_modified, pgc_modified_manifest

### Alterado
- Funções de manipulação de processos para suportar o novo esquema

## [1.2.0] - 2025-04-01

### Adicionado
- Criação do arquivo de instruções (instructions.md)
- Criação do arquivo de changelog (changelog.md)
- Nova opção de voto "Autos não tramitaram pelo MPC"
- Novo campo "Proposta de manifestação do MPC alterada pelo PGC?"
- Novo campo "Manifestação registrada pelo PGC"
- Novas colunas no banco de dados: pgc_modified_manifest e is_pgc_modified
- Editor de texto rico Quill adicionado aos campos:
  - Parecer do MPC
  - Relatório/Voto TCE
  - Voto Vista
  - Proposta de manifestação do MPC
  - Manifestação registrada pelo PGC
  - Suporte a formatação avançada em todos os campos
  - Interface intuitiva com botões em português
- Novas opções de exportação de pautas:
  - Exportação para Word (DOCX) com formatação rica preservada
  - Exportação para Excel (XLS) com dados tabulados
- Logo do MPC-GO adicionada ao cabeçalho dos documentos:
  - Logo pré-configurada no cabeçalho padrão
  - Exportação para Word com logo e formatação
  - Interface de prévia do cabeçalho atualizada
- Novo campo "Posição" para ordenação de processos:
  - Adicionado campo para definir a ordem do processo na pauta (1, 2, 3, etc)
  - Importação via planilha atribui posições sequenciais automaticamente
  - Nova coluna na tabela de processos exibindo a posição

### Alterado
- Campo "Parecer do MPC":
  - Não é exibido quando o tipo de voto é "não houve análise de mérito pelo MPC"
  - Obrigatório para os tipos de voto: "convergente", "divergente" e "parcialmente divergente"
  - Visível mas opcional para o tipo "autos não tramitaram pelo MPC"
  - Convertido para editor de texto rico
- Campos de texto longo convertidos para editor rico:
  - Relatório/Voto TCE
  - Voto Vista
  - Proposta de manifestação do MPC
  - Manifestação registrada pelo PGC
- Campo "Ementa" mantido como campo de texto simples
- Checkbox "Proposta de manifestação do MPC alterada pelo PGC?":
  - Agora só é visível quando o checkbox "Inserir proposta de manifestação do MPC" está marcado
  - Ao desmarcar "Inserir proposta de manifestação do MPC", os campos relacionados ao PGC são limpos e ocultados
- Atualização de textos no modal:
  - "Incluir manifestação do MPC?" alterado para "Inserir proposta de manifestação do MPC"
  - "Manifestação do MPC" alterado para "Proposta de manifestação do MPC"
- Correções de tipagem TypeScript para melhor segurança do código
- Interface de exportação de pautas:
  - Removida opção de exportação para PDF
  - Adicionado seletor de formato (Word/Excel)
  - Melhorada organização dos botões de exportação
- Página de configurações:
  - Adicionada prévia do cabeçalho em tempo real
  - Melhorado feedback de ações do usuário
  - Simplificada a interface de edição
- Tabela de processos:
  - Adicionada coluna "Posição" para exibir a ordem do processo na pauta
  - Renomeado o cabeçalho "Número da Pauta" para "Pauta"
  - Formulário de processos atualizado para incluir campo de posição

### Corrigido
- Corrigido erro "nodebuffer is not supported" na exportação de pautas para Word:
  - Substituído uso de Buffer por Uint8Array para compatibilidade com o navegador
  - Alterado método de geração do documento para usar toBlob em vez de toBuffer
- Corrigido erro na exportação de pautas para Word:
  - Adicionada validação dos dados obrigatórios antes da exportação
  - Melhorado tratamento de erro ao adicionar a logo do MPC-GO
  - Adicionados valores padrão para campos vazios
  - Melhorada a formatação do documento com espaçamentos consistentes
  - Aprimoradas as mensagens de erro para serem mais descritivas

### Removido
- Editor TinyMCE (pago) substituído por alternativa gratuita
- Editor rico removido do campo "Ementa"
- Exportação para PDF removida
- Removida a logo do MPC-GO e imagem do Unsplash do cabeçalho das pautas e da página de configurações

## Como usar este arquivo
- As alterações devem ser registradas em ordem cronológica reversa (mais recentes primeiro)
- Cada versão deve ter uma seção própria
- As mudanças devem ser categorizadas em:
  - Adicionado: para novos recursos
  - Modificado: para mudanças em recursos existentes
  - Removido: para recursos removidos
  - Corrigido: para correção de bugs

Data da última atualização: 03/04/2025
