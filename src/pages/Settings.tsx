import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Plus, Trash2, AlignLeft, AlignCenter, AlignRight, Loader2 } from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';

function Settings() {
  const {
    user,
    sessionTypes,
    documentConfig,
    loadInitialData,
    isLoading: storeLoading,
    error: storeError,
    updateUser,
    addSessionType,
    removeSessionType,
    updateDocumentConfig
  } = useStore();

  useEffect(() => {
    loadInitialData().catch(console.error);
  }, [loadInitialData]);

  const [newSessionType, setNewSessionType] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (storeLoading) {
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
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-red-600 hover:text-red-800"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const handleUserUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    updateUser({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as string,
      registration: formData.get('registration') as string,
    });
  };

  const handleAddSessionType = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSessionType.trim()) {
      addSessionType(newSessionType.trim());
      setNewSessionType('');
    }
  };

  const handleHeaderContentChange = (content: string) => {
    updateDocumentConfig({
      header: {
        ...documentConfig.header,
        content,
      },
    });
  };

  const handleFooterContentChange = (content: string) => {
    updateDocumentConfig({
      footer: {
        ...documentConfig.footer,
        content,
      },
    });
  };

  const handleHeaderAlignmentChange = (alignment: 'left' | 'center' | 'right') => {
    updateDocumentConfig({
      header: {
        ...documentConfig.header,
        alignment,
      },
    });
  };

  const handleFooterAlignmentChange = (alignment: 'left' | 'center' | 'right') => {
    updateDocumentConfig({
      footer: {
        ...documentConfig.footer,
        alignment,
      },
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Dados do Usuário</h3>
          <form onSubmit={handleUserUpdate} className="mt-5 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome
              </label>
              <input
                type="text"
                name="name"
                id="name"
                defaultValue={user.name}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <input
                type="email"
                name="email"
                id="email"
                defaultValue={user.email}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Cargo
              </label>
              <input
                type="text"
                name="role"
                id="role"
                defaultValue={user.role}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="registration" className="block text-sm font-medium text-gray-700">
                Matrícula
              </label>
              <input
                type="text"
                name="registration"
                id="registration"
                defaultValue={user.registration}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Tipos de Sessão</h3>
          <form onSubmit={handleAddSessionType} className="mt-5">
            <div className="flex gap-4">
              <input
                type="text"
                value={newSessionType}
                onChange={(e) => setNewSessionType(e.target.value)}
                placeholder="Nome do tipo de sessão"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </button>
            </div>
          </form>

          <ul className="mt-4 divide-y divide-gray-200">
            {sessionTypes.map((type) => (
              <li key={type} className="py-3 flex justify-between items-center">
                <span className="text-sm text-gray-900">{type}</span>
                <button
                  onClick={() => removeSessionType(type)}
                  className="text-red-600 hover:text-red-900"
                  title="Remover tipo de sessão"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Cabeçalho e Rodapé dos Documentos</h3>
          <div className="mt-5 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cabeçalho
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleHeaderAlignmentChange('left')}
                    className={`p-2 rounded ${
                      documentConfig.header.alignment === 'left'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                    title="Alinhar à esquerda"
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleHeaderAlignmentChange('center')}
                    className={`p-2 rounded ${
                      documentConfig.header.alignment === 'center'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                    title="Centralizar"
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleHeaderAlignmentChange('right')}
                    className={`p-2 rounded ${
                      documentConfig.header.alignment === 'right'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                    title="Alinhar à direita"
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                </div>
                <RichTextEditor
                  content={documentConfig.header.content}
                  onChange={handleHeaderContentChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rodapé
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFooterAlignmentChange('left')}
                    className={`p-2 rounded ${
                      documentConfig.footer.alignment === 'left'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                    title="Alinhar à esquerda"
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleFooterAlignmentChange('center')}
                    className={`p-2 rounded ${
                      documentConfig.footer.alignment === 'center'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                    title="Centralizar"
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleFooterAlignmentChange('right')}
                    className={`p-2 rounded ${
                      documentConfig.footer.alignment === 'right'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                    title="Alinhar à direita"
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                </div>
                <RichTextEditor
                  content={documentConfig.footer.content}
                  onChange={handleFooterContentChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;