import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Dialog } from '@headlessui/react';
import { Plus, Edit, Trash2, Search, FileText, Lock, Loader2, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import RichTextEditor from '../components/RichTextEditor';

function Processes() {
  const { 
    processes, 
    agendas, 
    loadInitialData,
    isLoading,
    error: storeError,
    addProcess,
    addProcesses,
    updateProcess, 
    deleteProcess
  } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasViewVote, setHasViewVote] = useState(false);
  const [showMpcManifest, setShowMpcManifest] = useState(false);
  const [showPgcManifest, setShowPgcManifest] = useState(false);
  const [selectedVoteType, setSelectedVoteType] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedAgendaId, setSelectedAgendaId] = useState('');
  const [importError, setImportError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [processToDelete, setProcessToDelete] = useState(null);
  const [availableWorksheets, setAvailableWorksheets] = useState([]);
  const [selectedWorksheet, setSelectedWorksheet] = useState('');
  const [workbookData, setWorkbookData] = useState(null);
  const [showWorksheetSelect, setShowWorksheetSelect] = useState(false);

  useEffect(() => {
    loadInitialData().catch(error => {
      console.error('Error loading data:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao carregar dados');
    });
  }, [loadInitialData]);

  useEffect(() => {
    if (editingProcess) {
      setHasViewVote(editingProcess.has_view_vote);
      setShowMpcManifest(!!editingProcess.mpc_system_manifest);
      setShowPgcManifest(!!editingProcess.pgc_manifest);
      setSelectedVoteType(editingProcess.vote_type);
    }
  }, [editingProcess]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        
        setWorkbookData(workbook);
        if (workbook.SheetNames.length > 1) {
          setAvailableWorksheets(workbook.SheetNames);
          setSelectedWorksheet(workbook.SheetNames[0]);
          setShowWorksheetSelect(true);
        } else {
          setSelectedWorksheet(workbook.SheetNames[0]);
          setShowWorksheetSelect(false);
        }
        setSelectedFile(file);
      } catch (error) {
        console.error('Error reading file:', error);
        setImportError('Erro ao ler o arquivo. Verifique se o formato está correto.');
      }
    }
  };

  const handleImport = async () => {
    if (!workbookData || !selectedAgendaId || !selectedWorksheet || isImporting) return;
    
    try {
      setIsImporting(true);
      setImportError('');

      const worksheet = workbookData.Sheets[selectedWorksheet];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });

      // Skip header row
      const rows = jsonData.slice(1);

      const processesToImport = rows
        .filter(row => row['A'] && row['C'])
        .map(row => ({
          id: crypto.randomUUID(),
          agendaId: selectedAgendaId,
          counselorName: row['A'] || '', // membro
          processNumber: row['C'] || '', // número do processo
          processType: row['H'] || '', // tipo de processo
          stakeholders: row['G'] || '', // interessados
          summary: row['F'] || '', // ementa
          voteType: '',
          mpcOpinionSummary: '',
          tceReportSummary: '',
          hasViewVote: false,
          viewVoteSummary: '',
          mpcSystemManifest: '',
          pgcManifest: ''
        }));

      if (processesToImport.length > 0) {
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
      } else {
        setImportError('Nenhum processo válido encontrado na planilha.');
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Erro ao importar arquivo. Verifique se o formato está correto.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleWorksheetSelect = () => {
    handleImport();
  };

  const filteredProcesses = processes.filter(process => 
    process.processNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    process.counselorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    process.processType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (process) => {
    setProcessToDelete(process);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (!processToDelete) return;
      await deleteProcess(processToDelete.id);
      setDeleteDialogOpen(false);
      setProcessToDelete(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao excluir o processo');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    try {
      const processData = {
        id: editingProcess?.id || crypto.randomUUID(),
        agendaId: formData.get('agendaId'),
        counselorName: formData.get('counselorName'),
        processNumber: formData.get('processNumber'),
        processType: formData.get('processType'),
        stakeholders: formData.get('stakeholders'),
        summary: formData.get('summary'),
        voteType: formData.get('voteType'),
        mpcOpinionSummary: formData.get('mpcOpinionSummary') || '',
        tceReportSummary: formData.get('tceReportSummary'),
        hasViewVote: hasViewVote,
        viewVoteSummary: hasViewVote ? formData.get('viewVoteSummary') : '',
        mpcSystemManifest: showMpcManifest ? formData.get('mpcSystemManifest') : '',
      };

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
      setSelectedVoteType('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao salvar o processo');
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
            <Upload className="h-4 w-4 mr-2" />
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

      {processes.length === 0 ? (
        <div className="bg-white shadow-sm rounded-lg p-8">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Número da Pauta
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Número do Processo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Conselheiro
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Tipo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Tipo de Voto
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <span>{agenda ? agenda.number : '-'}</span>
                          {agenda?.isFinished && (
                            <Lock className="h-4 w-4 text-gray-500" title="Pauta finalizada" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {process.processNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {process.counselorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {process.processType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {process.voteType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        <div className="flex justify-end space-x-4">
                          {!agenda?.isFinished && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingProcess(process);
                                  setIsOpen(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Editar processo"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(process)}
                                className="text-red-600 hover:text-red-900"
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
                  value={selectedAgendaId}
                  onChange={(e) => setSelectedAgendaId(e.target.value)}
                  disabled={isImporting}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
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
                        disabled={isImporting}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <div className={`px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white ${
                        isImporting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                      }`}>
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
                    onChange={(e) => setSelectedWorksheet(e.target.value)}
                    disabled={isImporting}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
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
                  disabled={isImporting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <Upload className="h-4 w-4 mr-2" />
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
          setSelectedVoteType('');
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
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
                  onChange={(e) => setSelectedVoteType(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="">Selecione um tipo</option>
                  <option value="não houve análise de mérito pelo MPC">Não houve análise de mérito pelo MPC</option>
                  <option value="convergente">Convergente</option>
                  <option value="divergente">Divergente</option>
                  <option value="parcialmente divergente">Parcialmente Divergente</option>
                </select>
              </div>

              {selectedVoteType !== 'não houve análise de mérito pelo MPC' && (
                <div>
                  <label htmlFor="mpcOpinionSummary" className="block text-sm font-medium text-gray-700">
                    Parecer do MPC
                  </label>
                  <textarea
                    id="mpcOpinionSummary"
                    name="mpcOpinionSummary"
                    rows={3}
                    defaultValue={editingProcess?.mpcOpinionSummary || ''}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
              )}

              <div>
                <label htmlFor="tceReportSummary" className="block text-sm font-medium text-gray-700">
                  Relatório/Voto TCE
                </label>
                <textarea
                  id="tceReportSummary"
                  name="tceReportSummary"
                  rows={3}
                  defaultValue={editingProcess?.tceReportSummary || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
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
                  <textarea
                    id="viewVoteSummary"
                    name="viewVoteSummary"
                    rows={3}
                    defaultValue={editingProcess?.viewVoteSummary || ''}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required={hasViewVote}
                  />
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showMpcManifest"
                  checked={showMpcManifest}
                  onChange={(e) => setShowMpcManifest(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="showMpcManifest" className="ml-2 block text-sm text-gray-900">
                  Incluir manifestação do MPC?
                </label>
              </div>

              {showMpcManifest && (
                <div>
                  <label htmlFor="mpcSystemManifest" className="block text-sm font-medium text-gray-700">
                    Manifestação do MPC
                  </label>
                  <RichTextEditor
                    content={editingProcess?.mpcSystemManifest || ''}
                    onChange={(content) => {
                      const textarea = document.getElementById('mpcSystemManifest');
                      if (textarea) {
                        textarea.value = content;
                      }
                    }}
                  />
                  <textarea
                    id="mpcSystemManifest"
                    name="mpcSystemManifest"
                    defaultValue={editingProcess?.mpcSystemManifest || ''}
                    className="hidden"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setEditingProcess(null);
                    setHasViewVote(false);
                    setShowMpcManifest(false);
                    setShowPgcManifest(false);
                    setSelectedVoteType('');
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
        <div className="flex min-h-screen items-center justify-center">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg w-[90%] max-w-xl mx-auto p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Confirmar Exclusão
            </Dialog.Title>

            <p className="text-sm text-gray-500">
              Tem certeza que deseja excluir este processo? Esta ação não pode ser desfeita.
            </p>

            <div className="mt-6 flex justify-end space-x-3">
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
    </div>
  );
}

export default Processes;
