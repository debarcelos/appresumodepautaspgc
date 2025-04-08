import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Dialog } from '@headlessui/react';
import { Plus, Edit, Trash2, Search, FileText, Lock, Loader2, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import RichTextEditor from '../components/RichTextEditor';

interface Process {
  id: string;
  agendaId: string;
  counselorName: string;
  processNumber: string;
  processType: string;
  stakeholders: string;
  summary: string;
  observations: string; // Campo adicionado
  voteType: string;
  mpcOpinionSummary: string;
  tceReportSummary: string;
  hasViewVote: boolean;
  viewVoteSummary: string;
  mpcSystemManifest: string;
  pgcModifiedManifest: string;
  isPgcModified: boolean;
  position: number;
  additionalNotes: string; // Mantemos na interface mas não será salvo no banco
  procuradorContas: string;
  type: string;
  number: string;
  sessionType: string;
  sessionNumber: number;
  vote: string;
  created_at: string;
  updated_at: string;
}

function Processes() {
  const { 
    processes, 
    agendas, 
    loadInitialData,
    addProcess,
    addProcesses,
    updateProcess, 
    deleteProcess,
    reorderProcesses,
    isLoading, 
    error: storeError
  } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgendaId, setSelectedAgendaId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [workbookData, setWorkbookData] = useState<XLSX.WorkBook | null>(null);
  const [selectedWorksheet, setSelectedWorksheet] = useState('');
  const [showWorksheetSelect, setShowWorksheetSelect] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [hasViewVote, setHasViewVote] = useState(false);
  const [showMpcManifest, setShowMpcManifest] = useState(false);
  const [showPgcManifest, setShowPgcManifest] = useState(false);
  const [isPgcModified, setIsPgcModified] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [positionConflictDialogOpen, setPositionConflictDialogOpen] = useState(false);
  const [pendingProcessData, setPendingProcessData] = useState<Process | null>(null);
  const [availableWorksheets, setAvailableWorksheets] = useState<string[]>([]);
  const [selectedVoteType, setSelectedVoteType] = useState('');
  const [processToDelete, setProcessToDelete] = useState<Process | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renumberDialogOpen, setRenumberDialogOpen] = useState(false);
  // Novos estados para filtros
  const [filters, setFilters] = useState({
    agendaId: '',
    processNumber: '',
    counselorName: '',
    processType: '',
    voteType: '',
    hasViewVote: '',
    stakeholders: '',
    summary: '',
    procuradorContas: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Estados para armazenar conteúdo dos campos ricos
  const [tceReportContent, setTceReportContent] = useState('');
  const [viewVoteContent, setViewVoteContent] = useState('');
  const [mpcOpinionContent, setMpcOpinionContent] = useState('');
  const [mpcManifestContent, setMpcManifestContent] = useState('');
  const [pgcManifestContent, setPgcManifestContent] = useState('');
  const [observationsContent, setObservationsContent] = useState(''); // Campo adicionado

  useEffect(() => {
    loadInitialData().catch(error => {
      console.error('Error loading data:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao carregar dados');
    });
  }, [loadInitialData]);

  useEffect(() => {
    if (editingProcess) {
      setHasViewVote(!!editingProcess.hasViewVote);
      setShowMpcManifest(!!editingProcess.mpcSystemManifest);
      setShowPgcManifest(!!editingProcess.pgcModifiedManifest);
      setIsPgcModified(editingProcess.isPgcModified);
      setSelectedVoteType(editingProcess.voteType);
      
      // Inicializar conteúdo dos campos
      setTceReportContent(editingProcess.tceReportSummary || '');
      setViewVoteContent(editingProcess.viewVoteSummary || '');
      setMpcOpinionContent(editingProcess.mpcOpinionSummary || '');
      setMpcManifestContent(editingProcess.mpcSystemManifest || '');
      setPgcManifestContent(editingProcess.pgcModifiedManifest || '');
      setObservationsContent(editingProcess.observations || ''); // Campo adicionado
    }
  }, [editingProcess]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportError('');
      setShowWorksheetSelect(false);
      setWorkbookData(null);
      setAvailableWorksheets([]);
      
      console.log('Arquivo selecionado:', file.name, file.type);
      
      // Verificar o tipo do arquivo
      const isExcel = /\.(xlsx|xls)$/i.test(file.name);
      if (!isExcel) {
        setImportError('Formato de arquivo não suportado. Por favor, selecione um arquivo Excel (.xlsx ou .xls).');
        return;
      }
      
      // Ler o arquivo como um ArrayBuffer
      const data = await file.arrayBuffer();
      console.log('Arquivo lido em buffer, tamanho:', data.byteLength);
      
      // Opções para leitura, ajustadas para maior compatibilidade
      const readOptions = {
        type: 'array' as const,
        cellFormula: false,
        cellHTML: false,
        cellText: true,
        cellDates: true,
        cellStyles: false,
        cellNF: false,
        sheetStubs: true
      };
      
      try {
        console.log('Tentando ler o workbook');
        const workbook = XLSX.read(data, readOptions);
        console.log('Workbook lido com sucesso, planilhas:', workbook.SheetNames);
        
        if (workbook.SheetNames.length === 0) {
          setImportError('O arquivo não contém planilhas.');
          return;
        }
        
        setWorkbookData(workbook);
        setAvailableWorksheets(workbook.SheetNames);
        setSelectedWorksheet(workbook.SheetNames[0]);
        setShowWorksheetSelect(true); 
        setImportError(''); // Limpar erro se a leitura for bem-sucedida
      } catch (error) {
        console.error('Erro ao ler o arquivo Excel:', error);
        setImportError('Não foi possível ler o arquivo Excel. Verifique se o arquivo não está corrompido.');
      }
    }
  };

  const handleImport = async () => {
    if (!workbookData || !selectedAgendaId || !selectedWorksheet || isImporting) return;
    
    try {
      setIsImporting(true);
      setImportError('');
      
      console.log('Convertendo planilha para JSON');
      
      // Logar a estrutura da planilha para debug
      console.log('Estrutura da planilha:', Object.keys(workbookData.Sheets[selectedWorksheet]));
      console.log('Range da planilha:', workbookData.Sheets[selectedWorksheet]['!ref']);
      
      // Método alternativo de processamento
      try {
        // Abordagem alternativa: extrair os dados manualmente
        const range = XLSX.utils.decode_range(workbookData.Sheets[selectedWorksheet]['!ref'] || 'A1:A1');
        console.log('Range decodificado:', range);
        
        // Criar um array de linhas manualmente
        const rows: Record<string, any>[] = [];
        
        // Processar cada linha, começando da segunda (índice 1)
        for (let rowIndex = 1; rowIndex <= range.e.r; rowIndex++) {
          const row: Record<string, any> = {};
          
          // Processar as colunas que nos interessam (A, C, F, G, H)
          const colKeys = ['A', 'C', 'F', 'G', 'H'];
          
          for (const colKey of colKeys) {
            const cellAddress = `${colKey}${rowIndex + 1}`; // +1 porque as células são 1-indexadas
            const cell = workbookData.Sheets[selectedWorksheet][cellAddress];
            
            if (cell) {
              // Tentar extrair o valor da célula
              try {
                row[colKey] = cell.v || '';
                console.log(`Célula ${cellAddress}:`, row[colKey]);
              } catch (cellError) {
                console.warn(`Erro ao ler célula ${cellAddress}:`, cellError);
                row[colKey] = '';
              }
            } else {
              row[colKey] = '';
            }
          }
          
          // Só adiciona a linha se tiver pelo menos os valores A e C
          if (row['A'] && row['C']) {
            rows.push(row);
          }
        }
        
        console.log('Linhas processadas manualmente:', rows.length);
        console.log('Primeiras linhas:', rows.slice(0, 2));
        
        if (rows.length === 0) {
          setImportError('Nenhum processo válido encontrado na planilha.');
          setIsImporting(false);
          return;
        }
        
        try {
          // Mapear para o formato Process
          const processesToImport: Process[] = rows.map((row, index) => ({
            id: crypto.randomUUID(),
            agendaId: selectedAgendaId,
            counselorName: String(row['A'] || ''),
            processNumber: String(row['C'] || ''),
            processType: String(row['H'] || 'A definir'),
            stakeholders: String(row['G'] || 'A definir'),
            summary: String(row['F'] || 'A definir'),
            observations: '', // Campo adicionado
            voteType: '',
            mpcOpinionSummary: '',
            tceReportSummary: 'A definir',
            hasViewVote: false,
            viewVoteSummary: '',
            mpcSystemManifest: '',
            pgcModifiedManifest: '',
            isPgcModified: false,
            position: index + 1,
            additionalNotes: '', // Mantemos na interface mas não será salvo no banco
            procuradorContas: '',
            type: String(row['H'] || 'A definir'),
            number: String(row['C'] || ''),
            sessionType: '',
            sessionNumber: 0, 
            vote: ''
            // Removidas as datas para deixar o store criar datas atualizadas
          } as Process));
          
          console.log('Processos filtrados para importação:', processesToImport.length);

          if (processesToImport.length > 0) {
            try {
              await addProcesses(processesToImport);
              
              setImportDialogOpen(false);
              setSelectedAgendaId('');
              setSelectedFile(null);
              setWorkbookData(null);
              setSelectedWorksheet('');
              setShowWorksheetSelect(false);
              setImportError('');
              setShowSuccessNotification(true);
              
              // Hide success notification after 3 seconds
              setTimeout(() => {
                setShowSuccessNotification(false);
              }, 3000);
            } catch (addError: any) {
              console.error('Erro ao inserir processos no banco:', addError);
              // Tentar obter detalhes mais específicos do erro
              let errorMessage = 'Erro ao inserir os processos no banco de dados.';
              
              if (addError.code === '23505') {
                errorMessage = 'Erro: Já existe um processo com esse número na base de dados.';
              } else if (addError.message) {
                errorMessage = `Erro: ${addError.message}`;
              } else if (addError.details) {
                errorMessage = `Erro: ${addError.details}`;
              }
              
              setImportError(errorMessage);
            }
          } else {
            setImportError('Nenhum processo válido encontrado na planilha.');
          }
        } catch (mapError) {
          console.error('Erro ao mapear dados para o formato Process:', mapError);
          setImportError('Erro ao processar os dados. Verifique o formato das células.');
        }
      } catch (error) {
        console.error('Erro ao processar a planilha:', error);
        setImportError('Erro ao processar a planilha. Verifique se o arquivo está corrompido.');
      } finally {
        setIsImporting(false);
      }
    } catch (error) {
      console.error('Erro geral na importação:', error);
      setImportError(error instanceof Error ? error.message : 'Erro ao importar arquivo. Verifique se o formato está correto.');
    }
  };

  const onWorksheetSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWorksheet(e.target.value);
  };

  const filteredProcesses = processes
    .filter(process => {
      // Aplicar pesquisa geral
      const matchesSearch = 
        searchTerm === '' ||
        process.processNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        process.counselorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        process.processType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        process.stakeholders.toLowerCase().includes(searchTerm.toLowerCase()) ||
        process.summary.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Aplicar filtros específicos
      const matchesAgenda = !filters.agendaId || process.agendaId === filters.agendaId;
      const matchesNumber = !filters.processNumber || 
        process.processNumber.toLowerCase().includes(filters.processNumber.toLowerCase());
      const matchesCounselor = !filters.counselorName || 
        process.counselorName.toLowerCase().includes(filters.counselorName.toLowerCase());
      const matchesType = !filters.processType || 
        process.processType.toLowerCase().includes(filters.processType.toLowerCase());
      const matchesVoteType = !filters.voteType || 
        process.voteType.toLowerCase().includes(filters.voteType.toLowerCase());
      const matchesViewVote = filters.hasViewVote === '' || 
        (filters.hasViewVote === 'sim' && process.hasViewVote) || 
        (filters.hasViewVote === 'não' && !process.hasViewVote);
      const matchesStakeholders = !filters.stakeholders || 
        process.stakeholders.toLowerCase().includes(filters.stakeholders.toLowerCase());
      const matchesSummary = !filters.summary || 
        process.summary.toLowerCase().includes(filters.summary.toLowerCase());
      const matchesProcuradorContas = !filters.procuradorContas || 
        (process.procuradorContas && process.procuradorContas.toLowerCase().includes(filters.procuradorContas.toLowerCase()));
      
      return matchesSearch && matchesAgenda && matchesNumber && matchesCounselor && 
        matchesType && matchesVoteType && matchesViewVote && matchesStakeholders && 
        matchesSummary && matchesProcuradorContas;
    })
    // Ordenar por agenda e posição
    .sort((a, b) => {
      // Primeiro ordenar por agenda
      if (a.agendaId !== b.agendaId) {
        const agendaA = agendas.find(agenda => agenda.id === a.agendaId);
        const agendaB = agendas.find(agenda => agenda.id === b.agendaId);
        
        if (agendaA && agendaB) {
          // Se ambas as agendas existem, ordena por data da agenda (mais recente primeiro)
          return new Date(agendaB.date).getTime() - new Date(agendaA.date).getTime();
        }
        
        // Se alguma agenda não for encontrada, usa o ID como fallback
        return a.agendaId.localeCompare(b.agendaId);
      }
      
      // Para processos da mesma agenda, ordenar por posição
      return (a.position || 0) - (b.position || 0);
    });

  const handleDeleteClick = (process: Process) => {
    setProcessToDelete(process);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (!processToDelete) return;
      const deletedProcess = await deleteProcess(processToDelete.id);
      setDeleteDialogOpen(false);
      
      // Perguntar se o usuário deseja renumerar os processos
      if (deletedProcess && deletedProcess.position) {
        setRenumberDialogOpen(true);
      } else {
        setProcessToDelete(null);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao excluir o processo');
      setProcessToDelete(null);
    }
  };

  const handleRenumberConfirm = async () => {
    try {
      if (!processToDelete) return;
      await reorderProcesses(processToDelete.agendaId, processToDelete.position || 0);
      setRenumberDialogOpen(false);
      setProcessToDelete(null);
      // Recarregar dados para refletir as alterações
      await loadInitialData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao renumerar os processos');
      setRenumberDialogOpen(false);
      setProcessToDelete(null);
    }
  };

  const handleRenumberCancel = () => {
    setRenumberDialogOpen(false);
    setProcessToDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const voteType = formData.get('voteType') as string;
    const mpcOpinionSummary = formData.get('mpcOpinionSummary') as string;
    
    // Validação do Parecer do MPC
    const requiresMpcOpinion = ['convergente', 'divergente', 'parcialmente divergente', 'não houve análise de mérito pelo MPC'].includes(voteType);
    if (requiresMpcOpinion && !mpcOpinionSummary) {
      setErrorMessage('O Parecer do MPC é obrigatório para o tipo de voto selecionado');
      return;
    }
    
    try {
      const processData: Process = {
        id: editingProcess ? editingProcess.id : crypto.randomUUID(),
        agendaId: formData.get('agendaId') as string,
        counselorName: formData.get('counselorName') as string,
        processNumber: formData.get('processNumber') as string,
        processType: formData.get('processType') as string,
        stakeholders: formData.get('stakeholders') as string,
        summary: formData.get('summary') as string,
        observations: formData.get('observations') as string, // Campo adicionado
        voteType: formData.get('voteType') as string,
        mpcOpinionSummary: formData.get('mpcOpinionSummary') as string || '',
        tceReportSummary: formData.get('tceReportSummary') as string || 'A definir',
        hasViewVote,
        viewVoteSummary: formData.get('viewVoteSummary') as string || '',
        mpcSystemManifest: formData.get('mpcSystemManifest') as string || '',
        pgcModifiedManifest: formData.get('pgcModifiedManifest') as string || '',
        isPgcModified,
        position: parseInt(formData.get('position') as string) || 1,
        additionalNotes: formData.get('additionalNotes') as string || '', // Mantemos na interface mas não será salvo no banco
        procuradorContas: formData.get('procuradorContas') as string || '',
        type: formData.get('processType') as string,
        number: formData.get('processNumber') as string,
        sessionType: '',
        sessionNumber: 0,
        vote: '',
        created_at: editingProcess?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Verificar se já existe um processo com a mesma posição e pauta
      const existingProcess = processes.find(
        p => p.position === processData.position && 
             p.agendaId === processData.agendaId && 
             p.id !== processData.id
      );

      if (existingProcess) {
        // Guardar os dados do processo e abrir o modal de confirmação
        setPendingProcessData(processData);
        setPositionConflictDialogOpen(true);
        return;
      }

      // Se não houver conflito, salvar normalmente
      await saveProcess(processData);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao salvar o processo');
    }
  };

  // Função para salvar um processo (novo ou editado)
  const saveProcess = async (processData: Process) => {
    try {
      if (editingProcess) {
        await updateProcess(processData);
      } else {
        await addProcess(processData);
      }
      
      setIsOpen(false);
      setEditingProcess(null);
      setHasViewVote(false);
      setShowMpcManifest(false);
      setShowPgcManifest(false);
      setIsPgcModified(false);
      setSelectedVoteType('');
      
      // Limpar conteúdo dos campos
      setTceReportContent('');
      setViewVoteContent('');
      setMpcOpinionContent('');
      setMpcManifestContent('');
      setPgcManifestContent('');
      setObservationsContent(''); // Campo adicionado
      
      // Reordenar processos após salvar
      await loadInitialData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao salvar o processo');
    }
  };

  // Função para ajustar as posições dos processos
  const adjustProcessPositions = async (processData: Process) => {
    try {
      // Filtrar processos da mesma pauta com posição igual ou maior
      const processesToAdjust = processes.filter(
        p => p.agendaId === processData.agendaId && 
             p.position >= processData.position &&
             p.id !== processData.id
      );

      // Ordenar por posição para ajustar corretamente (ordem decrescente para evitar conflitos)
      processesToAdjust.sort((a, b) => b.position - a.position);

      // Primeiro ajustar os demais processos (começando dos últimos para evitar conflitos)
      for (const proc of processesToAdjust) {
        const updatedProcess = {
          ...proc,
          position: proc.position + 1
        };
        await updateProcess(updatedProcess);
      }

      // Depois salvar o processo atual com a posição correta
      await saveProcess({
        ...processData,
        position: processData.position || 1 // Garantir que a posição não seja undefined ou null
      });

      setPositionConflictDialogOpen(false);
      setPendingProcessData(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao ajustar posições dos processos');
    }
  };

  // Função para salvar sem ajustar posições
  const saveWithoutAdjusting = async () => {
    if (pendingProcessData) {
      await saveProcess(pendingProcessData);
      setPositionConflictDialogOpen(false);
      setPendingProcessData(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Processos</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          {processes.length > 0 && (
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar processos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}
          <button
            onClick={() => setImportDialogOpen(true)}
            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Upload className="h-4 w-4 mr-2" aria-label="Importar" />
            Importar Processos
          </button>
          <button
            onClick={() => setIsOpen(true)}
            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Processo
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{errorMessage}</p>
          <button
            onClick={() => setErrorMessage('')}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Fechar
          </button>
        </div>
      )}

      <div className="mb-4 flex items-center gap-2">
        {isLoading && (
          <div className="flex items-center text-sm text-gray-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Carregando...
          </div>
        )}
        {storeError && (
          <div className="text-sm text-red-500">
            Erro: {storeError}
          </div>
        )}
      </div>

      {processes.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="mb-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            {showFilters ? 'Ocultar filtros avançados' : 'Mostrar filtros avançados'}
          </button>
          
          {showFilters && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="filterAgenda" className="block text-sm font-medium text-gray-700">
                    Pauta
                  </label>
                  <select
                    id="filterAgenda"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={filters.agendaId}
                    onChange={(e) => setFilters({...filters, agendaId: e.target.value})}
                  >
                    <option value="">Todas as pautas</option>
                    {agendas.map(agenda => (
                      <option key={agenda.id} value={agenda.id}>
                        {agenda.number} ({agenda.isFinished ? 'Finalizada' : 'Aberta'})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="filterNumber" className="block text-sm font-medium text-gray-700">
                    Número do Processo
                  </label>
                  <input
                    type="text"
                    id="filterNumber"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={filters.processNumber}
                    onChange={(e) => setFilters({...filters, processNumber: e.target.value})}
                    placeholder="Ex: 202300047002729"
                  />
                </div>
                
                <div>
                  <label htmlFor="filterCounselor" className="block text-sm font-medium text-gray-700">
                    Conselheiro
                  </label>
                  <input
                    type="text"
                    id="filterCounselor"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={filters.counselorName}
                    onChange={(e) => setFilters({...filters, counselorName: e.target.value})}
                    placeholder="Ex: SEBASTIÃO TEJOTA"
                  />
                </div>
                
                <div>
                  <label htmlFor="filterType" className="block text-sm font-medium text-gray-700">
                    Tipo
                  </label>
                  <input
                    type="text"
                    id="filterType"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={filters.processType}
                    onChange={(e) => setFilters({...filters, processType: e.target.value})}
                    placeholder="Ex: REPRESENTAÇÃO"
                  />
                </div>
                
                <div>
                  <label htmlFor="filterVoteType" className="block text-sm font-medium text-gray-700">
                    Tipo de Voto
                  </label>
                  <input
                    type="text"
                    id="filterVoteType"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={filters.voteType}
                    onChange={(e) => setFilters({...filters, voteType: e.target.value})}
                    placeholder="Ex: CONVERGENTE"
                  />
                </div>
                
                <div>
                  <label htmlFor="filterViewVote" className="block text-sm font-medium text-gray-700">
                    Teve Voto Vista
                  </label>
                  <select
                    id="filterViewVote"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={filters.hasViewVote}
                    onChange={(e) => setFilters({...filters, hasViewVote: e.target.value})}
                  >
                    <option value="">Todos</option>
                    <option value="sim">Sim</option>
                    <option value="não">Não</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="filterStakeholders" className="block text-sm font-medium text-gray-700">
                    Interessados
                  </label>
                  <input
                    type="text"
                    id="filterStakeholders"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={filters.stakeholders}
                    onChange={(e) => setFilters({...filters, stakeholders: e.target.value})}
                    placeholder="Ex: Secretaria de Estado"
                  />
                </div>
                
                <div>
                  <label htmlFor="filterSummary" className="block text-sm font-medium text-gray-700">
                    Ementa
                  </label>
                  <input
                    type="text"
                    id="filterSummary"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={filters.summary}
                    onChange={(e) => setFilters({...filters, summary: e.target.value})}
                    placeholder="Buscar no texto da ementa"
                  />
                </div>
                
                <div>
                  <label htmlFor="filterProcurador" className="block text-sm font-medium text-gray-700">
                    Procurador de Contas
                  </label>
                  <select
                    id="filterProcurador"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={filters.procuradorContas}
                    onChange={(e) => setFilters({...filters, procuradorContas: e.target.value})}
                  >
                    <option value="">Todos</option>
                    <option value="Carlos Gustavo Silva Rodrigues">Carlos Gustavo Silva Rodrigues</option>
                    <option value="Fernando dos Santos Carneiro">Fernando dos Santos Carneiro</option>
                    <option value="Maísa de Castro Sousa">Maísa de Castro Sousa</option>
                    <option value="Silvestre Gomes dos Anjos">Silvestre Gomes dos Anjos</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={() => setFilters({
                    agendaId: '',
                    processNumber: '',
                    counselorName: '',
                    processType: '',
                    voteType: '',
                    hasViewVote: '',
                    stakeholders: '',
                    summary: '',
                    procuradorContas: ''
                  })}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {processes.length === 0 ? (
        <div className="bg-white shadow-sm rounded-lg p-8">
          <div className="text-center">
            <FileText 
              className="mx-auto h-12 w-12 text-gray-400" 
              aria-label="Documento" 
            />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum processo cadastrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Clique no botão "Novo Processo" para começar a adicionar processos.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Pos.
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Pauta
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Número
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Conselheiro
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Procurador
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Tipo
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Tipo de Voto
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProcesses.map(process => {
                  const agenda = agendas.find(a => a.id === process.agendaId);
                  return (
                    <tr 
                      key={process.id}
                      className={`
                        transition-colors duration-150 ease-in-out
                        ${agenda?.isFinished ? 'bg-emerald-50' : 'bg-amber-50'}
                      `}
                    >
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">
                        <div className="truncate">
                          {process.position || '-'}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center space-x-1">
                          <span className="truncate">{agenda ? agenda.number : '-'}</span>
                          {agenda?.isFinished && (
                            <Lock className="h-4 w-4 flex-shrink-0 text-gray-500" aria-label="Pauta finalizada" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">
                        <div className="truncate" title={process.processNumber}>
                          {process.processNumber}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">
                        <div className="truncate" title={process.counselorName}>
                          {process.counselorName}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">
                        <div className="truncate" title={process.procuradorContas}>
                          {process.procuradorContas ? process.procuradorContas.toUpperCase() : '-'}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">
                        <div className="truncate" title={process.processType}>
                          {process.processType}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">
                        <div className="truncate" title={process.voteType}>
                          {process.voteType ? process.voteType.toUpperCase() : '-'}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 text-right">
                        <div className="flex justify-end space-x-2">
                          {!agenda?.isFinished && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingProcess(process);
                                  setIsOpen(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-900 flex-shrink-0"
                                title="Editar processo"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(process)}
                                className="text-red-600 hover:text-red-900 flex-shrink-0"
                                title="Excluir processo"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showSuccessNotification && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex items-center shadow-lg">
          <FileText className="h-5 w-5 text-green-400 mr-2" />
          Importação realizada com sucesso
        </div>
      )}

      {/* Import Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={() => {
          if (!isImporting) {
            setImportDialogOpen(false);
            setSelectedAgendaId('');
            setSelectedFile(null);
            setWorkbookData(null);
            setSelectedWorksheet('');
            setShowWorksheetSelect(false);
            setImportError('');
          }
        }}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex min-h-screen items-center justify-center">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg w-[90%] max-w-xl mx-auto p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Importar Processos
            </Dialog.Title>

            <div className="space-y-4">
              <div>
                <label htmlFor="agendaId" className="block text-sm font-medium text-gray-700">
                  Selecione a Pauta
                </label>
                <select
                  id="agendaId"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={selectedAgendaId}
                  onChange={(e) => setSelectedAgendaId(e.target.value)}
                >
                  <option value="">Selecione uma pauta</option>
                  {agendas
                    .filter(agenda => !agenda.isFinished)
                    .map(agenda => (
                      <option key={agenda.id} value={agenda.id}>
                        {agenda.number} ({agenda.isFinished ? 'Finalizada' : 'Aberta'})
                      </option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Arquivo Excel
                </label>
                <div className="mt-1 flex items-center space-x-2">
                  <label className="flex-1">
                    <div className="relative">
                      <input
                        type="file"
                        accept=".xls,.xlsx"
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">
                        Escolher arquivo
                      </div>
                    </div>
                  </label>
                  {selectedFile && (
                    <span className="text-sm text-gray-600">
                      {selectedFile.name}
                    </span>
                  )}
                </div>
              </div>

              {showWorksheetSelect && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Selecione a Planilha
                  </label>
                  <select
                    value={selectedWorksheet}
                    onChange={onWorksheetSelectChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    {availableWorksheets.map((sheet) => (
                      <option key={sheet} value={sheet}>
                        {sheet}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <p className="mt-2 text-xs text-gray-500">
                O arquivo deve conter as colunas: A (membro), C (número do processo), 
                H (tipo de processo), F (ementa), G (interessados)
              </p>

              {importError && (
                <p className="text-sm text-red-600">
                  {importError}
                </p>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    if (!isImporting) {
                      setImportDialogOpen(false);
                      setSelectedAgendaId('');
                      setSelectedFile(null);
                      setWorkbookData(null);
                      setSelectedWorksheet('');
                      setShowWorksheetSelect(false);
                      setImportError('');
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={!workbookData || !selectedAgendaId || !selectedWorksheet || isImporting}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" aria-label="Importar" />
                      Importar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
          setEditingProcess(null);
          setHasViewVote(false);
          setShowMpcManifest(false);
          setShowPgcManifest(false);
          setIsPgcModified(false);
          setSelectedVoteType('');
          
          // Limpar conteúdo dos campos
          setTceReportContent('');
          setViewVoteContent('');
          setMpcOpinionContent('');
          setMpcManifestContent('');
          setPgcManifestContent('');
          setObservationsContent(''); // Campo adicionado
        }}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex min-h-screen items-center justify-center p-4">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          <div className="relative bg-white rounded-lg w-[90%] max-w-6xl mx-auto p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              {editingProcess ? 'Editar Processo' : 'Novo Processo'}
            </Dialog.Title>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="agendaId" className="block text-sm font-medium text-gray-700">
                  Pauta
                </label>
                <select
                  id="agendaId"
                  name="agendaId"
                  defaultValue={editingProcess?.agendaId || ''}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Selecione uma pauta</option>
                  {agendas
                    .filter(agenda => !agenda.isFinished)
                    .map(agenda => (
                      <option key={agenda.id} value={agenda.id}>
                        {agenda.number} - {new Date(agenda.date).toLocaleDateString('pt-BR')}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                  Posição na Pauta
                </label>
                <input
                  type="number"
                  id="position"
                  name="position"
                  min="1"
                  defaultValue={editingProcess?.position || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Defina a ordem de apresentação deste processo na pauta (1, 2, 3, etc)
                </p>
              </div>

              <div>
                <label htmlFor="counselorName" className="block text-sm font-medium text-gray-700">
                  Conselheiro
                </label>
                <input
                  type="text"
                  id="counselorName"
                  name="counselorName"
                  defaultValue={editingProcess?.counselorName || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="processNumber" className="block text-sm font-medium text-gray-700">
                  Número do Processo
                </label>
                <input
                  type="text"
                  id="processNumber"
                  name="processNumber"
                  defaultValue={editingProcess?.processNumber || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="processType" className="block text-sm font-medium text-gray-700">
                  Tipo de Processo
                </label>
                <input
                  type="text"
                  id="processType"
                  name="processType"
                  defaultValue={editingProcess?.processType || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="stakeholders" className="block text-sm font-medium text-gray-700">
                  Interessados
                </label>
                <input
                  type="text"
                  id="stakeholders"
                  name="stakeholders"
                  defaultValue={editingProcess?.stakeholders || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
                  Ementa
                </label>
                <textarea
                  id="summary"
                  name="summary"
                  rows={3}
                  defaultValue={editingProcess?.summary || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="voteType" className="block text-sm font-medium text-gray-700">
                  Tipo de Voto
                </label>
                <select
                  id="voteType"
                  name="voteType"
                  value={selectedVoteType}
                  onChange={(e) => {
                    setSelectedVoteType(e.target.value);
                    // Atualiza também o objeto editingProcess para manter os estados sincronizados
                    if (editingProcess) {
                      setEditingProcess({
                        ...editingProcess,
                        voteType: e.target.value
                      });
                    }
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="">Selecione um tipo</option>
                  <option value="não houve análise de mérito pelo MPC">Não houve análise de mérito pelo MPC</option>
                  <option value="autos não tramitaram pelo MPC">Autos não tramitaram pelo MPC</option>
                  <option value="convergente">Convergente</option>
                  <option value="divergente">Divergente</option>
                  <option value="parcialmente divergente">Parcialmente Divergente</option>
                </select>
              </div>

              <div>
                <label htmlFor="observations" className="block text-sm font-medium text-gray-700">
                  Observações
                </label>
                <div className="mt-1">
                  <textarea
                    id="observations"
                    name="observations"
                    style={{ display: 'none' }}
                    defaultValue={observationsContent}
                  />
                  <RichTextEditor
                    content={observationsContent}
                    onChange={(content: string) => {
                      setObservationsContent(content);
                      const textarea = document.getElementById('observations') as HTMLTextAreaElement;
                      if (textarea) {
                        textarea.value = content;
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="procuradorContas" className="block text-sm font-medium text-gray-700">
                  Procurador de Contas
                </label>
                <select
                  id="procuradorContas"
                  name="procuradorContas"
                  value={editingProcess?.procuradorContas || ''}
                  onChange={(e) => {
                    if (editingProcess) {
                      const updatedProcess = {
                        ...editingProcess,
                        procuradorContas: e.target.value
                      };
                      setEditingProcess(updatedProcess);
                      // Garantir que o selectedVoteType continue sincronizado
                      if (updatedProcess.voteType) {
                        setSelectedVoteType(updatedProcess.voteType);
                      }
                    }
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Selecione um procurador</option>
                  <option value="Carlos Gustavo Silva Rodrigues">Carlos Gustavo Silva Rodrigues</option>
                  <option value="Fernando dos Santos Carneiro">Fernando dos Santos Carneiro</option>
                  <option value="Maísa de Castro Sousa">Maísa de Castro Sousa</option>
                  <option value="Silvestre Gomes dos Anjos">Silvestre Gomes dos Anjos</option>
                </select>
              </div>

              {(selectedVoteType === 'autos não tramitaram pelo MPC' ||
                selectedVoteType === 'convergente' ||
                selectedVoteType === 'divergente' ||
                selectedVoteType === 'parcialmente divergente' ||
                selectedVoteType === 'não houve análise de mérito pelo MPC') && (
                <div>
                  <label htmlFor="mpcOpinionSummary" className="block text-sm font-medium text-gray-700">
                    Parecer do MPC
                    {(selectedVoteType === 'convergente' || 
                      selectedVoteType === 'divergente' || 
                      selectedVoteType === 'parcialmente divergente' ||
                      selectedVoteType === 'não houve análise de mérito pelo MPC') && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="mpcOpinionSummary"
                      name="mpcOpinionSummary"
                      style={{ display: 'none' }}
                      defaultValue={mpcOpinionContent}
                    />
                    <RichTextEditor
                      content={mpcOpinionContent}
                      onChange={(content: string) => {
                        setMpcOpinionContent(content);
                        const textarea = document.getElementById('mpcOpinionSummary') as HTMLTextAreaElement;
                        if (textarea) {
                          textarea.value = content;
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="tceReportSummary" className="block text-sm font-medium text-gray-700">
                  Relatório/Voto TCE
                </label>
                <div className="mt-1">
                  <textarea
                    id="tceReportSummary"
                    name="tceReportSummary"
                    style={{ display: 'none' }}
                    defaultValue={tceReportContent}
                  />
                  <RichTextEditor
                    content={tceReportContent}
                    onChange={(content: string) => {
                      setTceReportContent(content);
                      const textarea = document.getElementById('tceReportSummary') as HTMLTextAreaElement;
                      if (textarea) {
                        textarea.value = content;
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasViewVote"
                  checked={hasViewVote}
                  onChange={(e) => setHasViewVote(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="hasViewVote" className="ml-2 block text-sm text-gray-900">
                  Teve voto vista?
                </label>
              </div>

              {hasViewVote && (
                <div>
                  <label htmlFor="viewVoteSummary" className="block text-sm font-medium text-gray-700">
                    Voto Vista
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="viewVoteSummary"
                      name="viewVoteSummary"
                      style={{ display: 'none' }}
                      defaultValue={viewVoteContent}
                    />
                    <RichTextEditor
                      content={viewVoteContent}
                      onChange={(content: string) => {
                        setViewVoteContent(content);
                        const textarea = document.getElementById('viewVoteSummary') as HTMLTextAreaElement;
                        if (textarea) {
                          textarea.value = content;
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showMpcManifest"
                    checked={showMpcManifest}
                    onChange={(e) => {
                      setShowMpcManifest(e.target.checked);
                      if (!e.target.checked) {
                        setIsPgcModified(false);
                        setShowPgcManifest(false);
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="showMpcManifest" className="ml-2 block text-sm text-gray-900">
                    Inserir proposta de manifestação do MPC
                  </label>
                </div>

                {showMpcManifest && (
                  <>
                    <div className="mt-4">
                      <label htmlFor="mpcSystemManifest" className="block text-sm font-medium text-gray-700">
                        Proposta de manifestação do MPC
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="mpcSystemManifest"
                          name="mpcSystemManifest"
                          style={{ display: 'none' }}
                          defaultValue={mpcManifestContent}
                        />
                        <RichTextEditor
                          content={mpcManifestContent}
                          onChange={(content: string) => {
                            setMpcManifestContent(content);
                            const textarea = document.getElementById('mpcSystemManifest') as HTMLTextAreaElement;
                            if (textarea) {
                              textarea.value = content;
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isPgcModified"
                          checked={isPgcModified}
                          onChange={(e) => {
                            setIsPgcModified(e.target.checked);
                            setShowPgcManifest(e.target.checked);
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="isPgcModified" className="ml-2 block text-sm text-gray-900">
                          Proposta de manifestação do MPC alterada pelo PGC?
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {showPgcManifest && (
                  <div className="mt-4">
                    <label htmlFor="pgcModifiedManifest" className="block text-sm font-medium text-gray-700">
                      Manifestação registrada pelo PGC
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="pgcModifiedManifest"
                        name="pgcModifiedManifest"
                        style={{ display: 'none' }}
                        defaultValue={pgcManifestContent}
                      />
                      <RichTextEditor
                        content={pgcManifestContent}
                        onChange={(content: string) => {
                          setPgcManifestContent(content);
                          const textarea = document.getElementById('pgcModifiedManifest') as HTMLTextAreaElement;
                          if (textarea) {
                            textarea.value = content;
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setEditingProcess(null);
                    setHasViewVote(false);
                    setShowMpcManifest(false);
                    setShowPgcManifest(false);
                    setIsPgcModified(false);
                    setSelectedVoteType('');
                    
                    // Limpar conteúdo dos campos
                    setTceReportContent('');
                    setViewVoteContent('');
                    setMpcOpinionContent('');
                    setMpcManifestContent('');
                    setPgcManifestContent('');
                    setObservationsContent(''); // Campo adicionado
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                >
                  {editingProcess ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setProcessToDelete(null);
        }}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex min-h-screen items-center justify-center p-4">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          <div className="relative bg-white rounded-lg p-6 w-full max-w-md mx-auto">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Confirmar Exclusão
            </Dialog.Title>
            <p className="mt-2 text-sm text-gray-500">
              Tem certeza que deseja excluir este processo? Esta ação não pode ser desfeita.
            </p>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setProcessToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Renumber Confirmation Dialog */}
      <Dialog
        open={renumberDialogOpen}
        onClose={handleRenumberCancel}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex min-h-screen items-center justify-center p-4">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          <div className="relative bg-white rounded-lg p-6 w-full max-w-md mx-auto">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Renumerar processos
            </Dialog.Title>
            <p className="mt-2 text-sm text-gray-500">
              A exclusão do processo alterará a ordem da pauta. Deseja renumerar os processos seguintes, diminuindo em 1 a posição de cada um?
            </p>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleRenumberCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Não renumerar
              </button>
              <button
                type="button"
                onClick={handleRenumberConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
              >
                Renumerar
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Modal de confirmação para ajuste de posições */}
      <Dialog
        open={positionConflictDialogOpen}
        onClose={() => setPositionConflictDialogOpen(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          <div className="relative bg-white rounded-lg max-w-md w-full mx-auto p-6 shadow-xl">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Conflito de posição
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-gray-500">
              Você alterou a posição do processo na pauta, e já existe outro processo nesta posição. 
              Deseja ajustar as posições dos processos subsequentes?
            </Dialog.Description>

            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={saveWithoutAdjusting}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Não, manter como está
              </button>
              <button
                type="button"
                onClick={() => pendingProcessData && adjustProcessPositions(pendingProcessData)}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
              >
                Sim, ajustar posições
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default Processes;
