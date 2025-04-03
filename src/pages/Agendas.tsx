import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Plus, Edit, Trash2, Download, Search, ClipboardList, CheckCircle2, RefreshCcw, Loader2 } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { Agenda } from '../types';
import { exportToWord, exportToExcel } from '../utils/exportUtils';

function Agendas() {
  const { 
    agendas, 
    processes,
    sessionTypes, 
    loadInitialData,
    isLoading,
    error: storeError,
    addAgenda, 
    updateAgenda, 
    deleteAgenda, 
    toggleAgendaFinished 
  } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<Agenda | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);
  const [agendaToFinish, setAgendaToFinish] = useState<Agenda | null>(null);
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [agendaToReopen, setAgendaToReopen] = useState<Agenda | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agendaToDelete, setAgendaToDelete] = useState<Agenda | null>(null);
  const [exportFormat, setExportFormat] = useState<'docx' | 'xlsx'>('docx');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadInitialData().catch(error => {
      console.error('Error loading data:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao carregar dados');
    });
  }, [loadInitialData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (storeError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erro ao carregar dados: {storeError}</p>
        <button
          onClick={() => loadInitialData()}
          className="mt-2 text-sm text-red-600 hover:text-red-800"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const filteredAgendas = agendas.filter(agenda => 
    agenda.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agenda.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    try {
      const agendaData: Agenda = {
        id: editingAgenda?.id || crypto.randomUUID(),
        type: formData.get('type') as string,
        number: formData.get('number') as string,
        date: formData.get('date') as string,
        isFinished: editingAgenda?.isFinished || false,
      };

      if (editingAgenda) {
        await updateAgenda(agendaData);
      } else {
        await addAgenda(agendaData);
      }

      setIsOpen(false);
      setEditingAgenda(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao salvar a pauta');
    }
  };

  const handleExport = async (agenda: Agenda) => {
    if (!agenda.isFinished) {
      setErrorMessage('Antes de exportar é preciso finalizar a pauta.');
      return;
    }

    setIsExporting(true);
    try {
      const agendaProcesses = processes
        .filter(p => p.agendaId === agenda.id)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      
      if (exportFormat === 'docx') {
        await exportToWord(agenda, agendaProcesses);
      } else if (exportFormat === 'xlsx') {
        exportToExcel(agenda, agendaProcesses);
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao exportar a pauta. Por favor, tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFinishAgenda = (agenda: Agenda) => {
    setAgendaToFinish(agenda);
    setFinishConfirmOpen(true);
  };

  const handleReopenAgenda = (agenda: Agenda) => {
    setAgendaToReopen(agenda);
    setReopenDialogOpen(true);
  };

  const handleDeleteAgenda = (agenda: Agenda) => {
    setAgendaToDelete(agenda);
    setDeleteDialogOpen(true);
  };

  const handleFormatChange = (format: 'docx' | 'xlsx') => {
    setExportFormat(format);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (!agendaToDelete) return;
      await deleteAgenda(agendaToDelete.id);
      setDeleteDialogOpen(false);
      setAgendaToDelete(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao excluir a pauta');
    }
  };

  const handleFinishConfirm = async () => {
    try {
      if (!agendaToFinish) return;
      await toggleAgendaFinished(agendaToFinish.id);
      setFinishConfirmOpen(false);
      setAgendaToFinish(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao finalizar a pauta');
    }
  };

  const handleReopenConfirm = async () => {
    try {
      if (!agendaToReopen) return;
      await toggleAgendaFinished(agendaToReopen.id);
      setReopenDialogOpen(false);
      setAgendaToReopen(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao reabrir a pauta');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Pautas</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          {agendas.length > 0 && (
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar pautas..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}
          <button
            onClick={() => setIsOpen(true)}
            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Pauta
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

      {agendas.length === 0 ? (
        <div className="bg-white shadow-sm rounded-lg p-8">
          <div className="text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma pauta cadastrada</h3>
            <p className="mt-1 text-sm text-gray-500">
              Clique no botão "Nova Pauta" para começar a adicionar pautas.
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
                    Número da Pauta
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Tipo de Sessão
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Data da Sessão
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Processos
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAgendas.map(agenda => (
                  <tr 
                    key={agenda.id}
                    className={agenda.isFinished ? 'bg-emerald-50' : 'bg-amber-50'}
                  >
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {agenda.number}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {agenda.type}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(agenda.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {processes.filter(p => p.agendaId === agenda.id).length}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex justify-end space-x-2 sm:space-x-4">
                        <button
                          onClick={() => {
                            setEditingAgenda(agenda);
                            setIsOpen(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Editar pauta"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAgenda(agenda)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir pauta"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {agenda.isFinished ? (
                          <button
                            onClick={() => handleReopenAgenda(agenda)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Reabrir pauta"
                          >
                            <RefreshCcw className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleFinishAgenda(agenda)}
                            className="text-green-600 hover:text-green-900"
                            title="Finalizar pauta"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        <select
                          value={exportFormat}
                          onChange={(e) => handleFormatChange(e.target.value as 'docx' | 'xlsx')}
                          className="text-sm border rounded-md px-2 py-1"
                        >
                          <option value="docx">Word</option>
                          <option value="xlsx">Excel</option>
                        </select>
                        <button
                          onClick={() => handleExport(agenda)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Exportar pauta"
                          disabled={isExporting}
                        >
                          {isExporting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Finish Confirmation Dialog */}
      <Dialog
        open={finishConfirmOpen}
        onClose={() => {
          setFinishConfirmOpen(false);
          setAgendaToFinish(null);
        }}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex min-h-screen items-center justify-center p-4">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Confirmar Finalização
            </Dialog.Title>

            <p className="text-sm text-gray-500">
              Tem certeza que deseja finalizar esta pauta? Após finalizada, a pauta não poderá ser modificada.
              {agendaToFinish && (
                <span className="block mt-2 font-medium">
                  Pauta: {agendaToFinish.number} - {new Date(agendaToFinish.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
              )}
            </p>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setFinishConfirmOpen(false);
                  setAgendaToFinish(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleFinishConfirm}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Finalizar Pauta
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Reopen Confirmation Dialog */}
      <Dialog
        open={reopenDialogOpen}
        onClose={() => {
          setReopenDialogOpen(false);
          setAgendaToReopen(null);
        }}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex min-h-screen items-center justify-center p-4">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Confirmar Reabertura
            </Dialog.Title>

            <p className="text-sm text-gray-500">
              Tem certeza que deseja reabrir esta pauta? Isso permitirá que ela seja modificada novamente.
              {agendaToReopen && (
                <span className="block mt-2 font-medium">
                  Pauta: {agendaToReopen.number} - {new Date(agendaToReopen.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
              )}
            </p>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setReopenDialogOpen(false);
                  setAgendaToReopen(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReopenConfirm}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Reabrir Pauta
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setAgendaToDelete(null);
        }}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex min-h-screen items-center justify-center">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Confirmar Exclusão
            </Dialog.Title>

            <p className="text-sm text-gray-500">
              Tem certeza que deseja excluir esta pauta? Esta ação não pode ser desfeita.
              {agendaToDelete && (
                <span className="block mt-2 font-medium">
                  Pauta: {agendaToDelete.number} - {new Date(agendaToDelete.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
              )}
            </p>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setAgendaToDelete(null);
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

      {/* Create/Edit Dialog */}
      <Dialog
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
          setEditingAgenda(null);
        }}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex min-h-screen items-center justify-center p-4">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              {editingAgenda ? 'Editar Pauta' : 'Nova Pauta'}
            </Dialog.Title>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Tipo de Sessão
                </label>
                <select
                  id="type"
                  name="type"
                  defaultValue={editingAgenda?.type || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="">Selecione um tipo</option>
                  {sessionTypes.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="number" className="block text-sm font-medium text-gray-700">
                  Número
                </label>
                <input
                  type="text"
                  id="number"
                  name="number"
                  defaultValue={editingAgenda?.number || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Data
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  defaultValue={editingAgenda?.date || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setEditingAgenda(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                >
                  {editingAgenda ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default Agendas;