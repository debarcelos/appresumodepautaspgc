import React, { useState } from 'react';
import { useStore } from '../store';
import { User } from '../types';

const defaultHeader = `
<div style="text-align: center; margin-bottom: 20px;">
  <p style="font-family: Arial; font-size: 12pt; font-weight: bold; margin: 5px 0;">
    MINISTÉRIO PÚBLICO DE CONTAS DO ESTADO DE GOIÁS
  </p>
  <p style="font-family: Arial; font-size: 10pt; margin: 5px 0;">
    Controle Externo da Administração Pública Estadual
  </p>
</div>`;

function Settings() {
  const { documentConfig, updateDocumentConfig, user, updateUser } = useStore();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleHeaderContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateDocumentConfig({
      ...documentConfig,
      header: {
        ...documentConfig.header,
        content: e.target.value
      }
    });
  };

  const handleHeaderAlignmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateDocumentConfig({
      ...documentConfig,
      header: {
        ...documentConfig.header,
        alignment: e.target.value as 'left' | 'center' | 'right'
      }
    });
  };

  const handleUserUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const updatedUser: Partial<User> = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        role: formData.get('role') as string,
        registration: formData.get('registration') as string,
      };

      // Manter o id e token do usuário atual
      if (user) {
        updatedUser.id = user.id;
        updatedUser.token = user.token;
      }

      updateUser(updatedUser as User);
      setSuccessMessage('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetToDefault = () => {
    updateDocumentConfig({
      ...documentConfig,
      header: {
        content: defaultHeader,
        alignment: 'center'
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Perfil do Usuário</h2>
        
        <form onSubmit={handleUserUpdate}>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome
              </label>
              <input
                type="text"
                name="name"
                defaultValue={user?.name}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <input
                type="email"
                name="email"
                defaultValue={user?.email}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cargo
              </label>
              <input
                type="text"
                name="role"
                defaultValue={user?.role}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Matrícula
              </label>
              <input
                type="text"
                name="registration"
                defaultValue={user?.registration}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Cabeçalho e Rodapé dos Documentos</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alinhamento do Cabeçalho
          </label>
          <select
            value={documentConfig.header.alignment}
            onChange={handleHeaderAlignmentChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="left">Esquerda</option>
            <option value="center">Centro</option>
            <option value="right">Direita</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Conteúdo do Cabeçalho (HTML)
          </label>
          <textarea
            value={documentConfig.header.content}
            onChange={handleHeaderContentChange}
            rows={10}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prévia do Cabeçalho
          </label>
          <div
            className="border rounded-md p-4 bg-gray-50"
            dangerouslySetInnerHTML={{ __html: documentConfig.header.content }}
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={resetToDefault}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Restaurar Padrão
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;