import { create } from 'zustand';
import { Agenda, Process, User, Stakeholder, DocumentConfig, AuthState } from './types';
import { supabase } from './lib/supabase';
import { PostgrestResponse } from '@supabase/supabase-js';

interface Store {
  agendas: Agenda[];
  processes: Process[];
  user: User | null;
  sessionTypes: string[];
  stakeholders: Stakeholder[];
  documentConfig: DocumentConfig;
  prosecutors: string[];
  auth: AuthState;
  isLoading: boolean;
  error: string | null;
  addAgenda: (agenda: Agenda) => Promise<void>;
  updateAgenda: (agenda: Agenda) => Promise<void>;
  deleteAgenda: (id: string) => Promise<void>;
  toggleAgendaFinished: (id: string) => Promise<void>;
  addProcess: (process: Process) => Promise<void>;
  addProcesses: (processes: Process[]) => Promise<void>;
  updateProcess: (process: Process) => Promise<void>;
  deleteProcess: (id: string) => Promise<Process>;
  updateUser: (user: User) => void;
  addSessionType: (type: string) => void;
  removeSessionType: (type: string) => void;
  addStakeholder: (stakeholder: Omit<Stakeholder, 'id'>) => Promise<void>;
  updateStakeholder: (stakeholder: Stakeholder) => Promise<void>;
  deleteStakeholder: (id: string) => Promise<void>;
  updateDocumentConfig: (config: Partial<DocumentConfig>) => void;
  addProsecutor: (name: string) => void;
  removeProsecutor: (name: string) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: Omit<User, 'id'> & { password: string }) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  initializeAuth: () => Promise<void>;
  loadInitialData: () => Promise<void>;
  forceAuthForPreview: () => void;
  reorderProcesses: (agendaId: string, deletedPosition: number) => Promise<void>;
}

const defaultHeader = `<div style="text-align: center;">
  <p style="font-weight: bold;">MINISTÉRIO PÚBLICO DE CONTAS DO ESTADO DE GOIÁS</p>
  <p style="font-weight: bold; font-family: Arial; font-size: 11pt;">Controle Externo da Administração Pública Estadual</p>
</div>`;

export const useStore = create<Store>((set, get) => ({
  agendas: [],
  processes: [],
  user: {
    id: '',
    name: '',
    email: '',
    role: '',
    registration: '',
    token: '',
  },
  sessionTypes: ['Sessão Ordinária', 'Sessão Extraordinária Administrativa'],
  stakeholders: [],
  documentConfig: {
    header: {
      content: defaultHeader,
      alignment: 'center',
    },
    footer: {
      content: '',
      alignment: 'center',
    },
  },
  auth: {
    isAuthenticated: false,
    isAnonymous: false,
    user: null,
    loading: false,
    error: null,
  },
  isLoading: false,
  error: null,
  prosecutors: [],

  // Função para forçar autenticação para preview
  forceAuthForPreview: () => {
    const previewUser: User = {
      id: 'preview-user',
      name: 'Usuário Preview',
      email: 'preview@example.com',
      role: 'admin',
      registration: 'PREVIEW',
      token: 'preview-token'
    };

    set({
      auth: {
        isAuthenticated: true,
        isAnonymous: true,
        user: previewUser,
        loading: false,
        error: null
      },
      user: previewUser
    });
  },

  loadInitialData: async () => {
    try {
      set({ isLoading: true, error: null });

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        set({ isLoading: false });
        return;
      }

      const [agendasResult, processesResult, stakeholdersResult] = await Promise.all([
        supabase.from('agendas').select('*').order('created_at', { ascending: false }),
        supabase.from('processes').select('*'),
        supabase.from('stakeholders').select('*').eq('user_id', session.user.id)
      ]) as [
        PostgrestResponse<any>,
        PostgrestResponse<any>,
        PostgrestResponse<any>
      ];

      if (agendasResult.error) throw agendasResult.error;
      if (processesResult.error) throw processesResult.error;
      if (stakeholdersResult.error) throw stakeholdersResult.error;

      const agendas = (agendasResult.data || []).map((agenda: any) => ({
        id: agenda.id,
        number: agenda.number,
        date: agenda.date,
        type: agenda.type,
        isFinished: agenda.is_finished,
        createdAt: agenda.created_at,
        updatedAt: agenda.updated_at
      })) as Agenda[];

      const processes = (processesResult.data || []).map((process: any) => ({
        id: process.id,
        agendaId: process.agenda_id,
        counselorName: process.counselor_name,
        processNumber: process.process_number,
        processType: process.process_type,
        stakeholders: process.stakeholders,
        summary: process.summary,
        voteType: process.vote_type || '',
        mpcOpinionSummary: process.mpc_opinion_summary || '',
        tceReportSummary: process.tce_report_summary || 'A definir',
        hasViewVote: process.has_view_vote || false,
        viewVoteSummary: process.view_vote_summary || '',
        mpcSystemManifest: process.mpc_system_manifest || '',
        pgcModifiedManifest: process.pgc_modified_manifest || '',
        isPgcModified: process.is_pgc_modified || false,
        position: process.order,
        procuradorContas: process.procurador_contas || '',
        observations: process.observations || '',
        additionalNotes: '', // Campo não existente no banco, mas presente na interface
        type: process.process_type || '',
        number: process.process_number || '',
        sessionType: '',
        sessionNumber: 0,
        vote: '',
        created_at: process.created_at || new Date().toISOString(),
        updated_at: process.updated_at || new Date().toISOString()
      })) as Process[];

      const stakeholders = (stakeholdersResult.data || []).map((stakeholder: any) => ({
        id: stakeholder.id,
        name: stakeholder.name,
        type: stakeholder.type,
        role: stakeholder.role || '',
        email: stakeholder.email || ''
      })) as Stakeholder[];

      set({ agendas, processes, stakeholders, isLoading: false });
    } catch (error) {
      console.error('Error loading initial data:', error);
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  toggleAgendaFinished: async (id) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('Você precisa estar autenticado para alterar o status da pauta');
      }

      const agenda = get().agendas.find((a) => a.id === id);
      if (!agenda) {
        throw new Error('Pauta não encontrada');
      }

      const { data, error } = await supabase
        .from('agendas')
        .update({ is_finished: !agenda.isFinished })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        throw new Error('Não foi possível alterar o status da pauta. Por favor, tente novamente.');
      }

      if (!data) {
        throw new Error('Não foi possível alterar o status da pauta. Por favor, tente novamente.');
      }

      set((state) => ({
        agendas: state.agendas.map((a) =>
          a.id === id ? { ...a, isFinished: data.is_finished } : a
        ),
      }));
    } catch (error) {
      console.error('Error toggling agenda finished state:', error);
      throw error;
    }
  },

  addAgenda: async (agenda) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('Você precisa estar autenticado para criar uma pauta');
      }

      const { data, error } = await supabase
        .from('agendas')
        .insert([{
          type: agenda.type,
          number: agenda.number,
          date: agenda.date,
          is_finished: false,
          user_id: session.user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error('Não foi possível criar a pauta. Por favor, tente novamente.');
      }

      if (!data) {
        throw new Error('Não foi possível criar a pauta. Por favor, tente novamente.');
      }

      const newAgenda: Agenda = {
        id: data.id,
        type: data.type,
        number: data.number,
        date: data.date,
        isFinished: data.is_finished
      };

      set((state) => ({ ...state, agendas: [...state.agendas, newAgenda] }));
    } catch (error) {
      console.error('Error adding agenda:', error);
      throw error;
    }
  },

  updateAgenda: async (agenda) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('Você precisa estar autenticado para atualizar uma pauta');
      }

      const { error } = await supabase
        .from('agendas')
        .update({
          type: agenda.type,
          number: agenda.number,
          date: agenda.date,
          is_finished: agenda.isFinished
        })
        .eq('id', agenda.id);

      if (error) {
        throw new Error('Não foi possível atualizar a pauta. Por favor, tente novamente.');
      }

      set((state) => ({
        ...state,
        agendas: state.agendas.map((a) => (a.id === agenda.id ? agenda : a)),
      }));
    } catch (error) {
      console.error('Error updating agenda:', error);
      throw error;
    }
  },

  deleteAgenda: async (id) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('Você precisa estar autenticado para excluir uma pauta');
      }

      const { error } = await supabase
        .from('agendas')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error('Não foi possível excluir a pauta. Por favor, tente novamente.');
      }

      set((state) => ({
        ...state,
        agendas: state.agendas.filter((a) => a.id !== id),
        processes: state.processes.filter((p) => p.agendaId !== id),
      }));
    } catch (error) {
      console.error('Error deleting agenda:', error);
      throw error;
    }
  },

  addProcess: async (process) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('Você precisa estar autenticado para adicionar um processo');
      }

      const { data, error } = await supabase
        .from('processes')
        .insert([{
          agenda_id: process.agendaId,
          counselor_name: process.counselorName,
          process_number: process.processNumber,
          process_type: process.processType,
          stakeholders: process.stakeholders,
          summary: process.summary,
          vote_type: process.voteType || '',
          mpc_opinion_summary: process.mpcOpinionSummary || '',
          tce_report_summary: process.tceReportSummary || 'A definir',
          has_view_vote: process.hasViewVote || false,
          view_vote_summary: process.viewVoteSummary || '',
          mpc_system_manifest: process.mpcSystemManifest || '',
          pgc_modified_manifest: process.pgcModifiedManifest || '',
          is_pgc_modified: process.isPgcModified || false,
          order: process.position,
          procurador_contas: process.procuradorContas || '',
          observations: process.observations || '',
          user_id: session.user.id
        }])
        .select()
        .single();

      if (error) {
        throw new Error('Não foi possível adicionar o processo. Por favor, tente novamente.');
      }

      if (data) {
        const newProcess: Process = {
          id: data.id,
          agendaId: data.agenda_id,
          counselorName: data.counselor_name,
          processNumber: data.process_number,
          processType: data.process_type,
          stakeholders: data.stakeholders,
          summary: data.summary,
          voteType: data.vote_type || '',
          mpcOpinionSummary: data.mpc_opinion_summary || '',
          tceReportSummary: data.tce_report_summary || 'A definir',
          hasViewVote: data.has_view_vote || false,
          viewVoteSummary: data.view_vote_summary || '',
          mpcSystemManifest: data.mpc_system_manifest || '',
          pgcModifiedManifest: data.pgc_modified_manifest || '',
          isPgcModified: data.is_pgc_modified || false,
          position: data.order,
          procuradorContas: data.procurador_contas || '',
          observations: data.observations || '',
          additionalNotes: '', // Campo não existente no banco, mas presente na interface
          type: data.process_type || '',
          number: data.process_number || '',
          sessionType: '',
          sessionNumber: 0,
          vote: '',
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString()
        };
        set((state) => ({ ...state, processes: [...state.processes, newProcess] }));
      }
    } catch (error) {
      console.error('Error adding process:', error);
      throw error;
    }
  },

  addProcesses: async (processes: Process[]) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('Você precisa estar autenticado para adicionar processos');
      }

      const allNewProcesses: Process[] = [];

      for (const process of processes) {
        try {
          const { data, error } = await supabase
            .from('processes')
            .insert([{
              agenda_id: process.agendaId,
              counselor_name: process.counselorName,
              process_number: process.processNumber,
              process_type: process.processType,
              stakeholders: process.stakeholders,
              summary: process.summary,
              vote_type: process.voteType || '',
              mpc_opinion_summary: process.mpcOpinionSummary || '',
              tce_report_summary: process.tceReportSummary || 'A definir',
              has_view_vote: process.hasViewVote || false,
              view_vote_summary: process.viewVoteSummary || '',
              mpc_system_manifest: process.mpcSystemManifest || '',
              pgc_modified_manifest: process.pgcModifiedManifest || '',
              is_pgc_modified: process.isPgcModified || false,
              order: process.position || 1,
              procurador_contas: process.procuradorContas || '',
              observations: process.observations || '',
              user_id: session.user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select()
            .single();

          if (error) {
            console.error('Erro detalhado:', error);
            throw error;
          }

          if (data) {
            allNewProcesses.push({
              id: data.id,
              agendaId: data.agenda_id,
              counselorName: data.counselor_name,
              processNumber: data.process_number,
              processType: data.process_type,
              stakeholders: data.stakeholders,
              summary: data.summary,
              voteType: data.vote_type || '',
              mpcOpinionSummary: data.mpc_opinion_summary || '',
              tceReportSummary: data.tce_report_summary || 'A definir',
              hasViewVote: data.has_view_vote || false,
              viewVoteSummary: data.view_vote_summary || '',
              mpcSystemManifest: data.mpc_system_manifest || '',
              pgcModifiedManifest: data.pgc_modified_manifest || '',
              isPgcModified: data.is_pgc_modified || false,
              position: data.order,
              procuradorContas: data.procurador_contas || '',
              observations: data.observations || '',
              additionalNotes: '', // Campo não existente no banco, mas presente na interface
              type: data.process_type || '',
              number: data.process_number || '',
              sessionType: '',
              sessionNumber: 0,
              vote: '',
              created_at: data.created_at || new Date().toISOString(),
              updated_at: data.updated_at || new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Error adding process:', error);
          throw error;
        }
      }

      set((state) => ({ 
        ...state, 
        processes: [...state.processes, ...allNewProcesses] 
      }));
    } catch (error) {
      console.error('Error adding processes:', error);
      throw error;
    }
  },

  updateProcess: async (process) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error('Você precisa estar autenticado para atualizar processos');
      }

      const { data, error } = await supabase
        .from('processes')
        .update({
          counselor_name: process.counselorName,
          process_number: process.processNumber,
          process_type: process.processType,
          stakeholders: process.stakeholders,
          summary: process.summary,
          vote_type: process.voteType,
          mpc_opinion_summary: process.mpcOpinionSummary,
          tce_report_summary: process.tceReportSummary,
          has_view_vote: process.hasViewVote,
          view_vote_summary: process.viewVoteSummary,
          mpc_system_manifest: process.mpcSystemManifest,
          pgc_modified_manifest: process.pgcModifiedManifest,
          is_pgc_modified: process.isPgcModified,
          procurador_contas: process.procuradorContas || '',
          observations: process.observations || '',
          order: process.position, // Garantir que a posição seja atualizada
          updated_at: new Date().toISOString()
        })
        .eq('id', process.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating process:', error);
        throw error;
      }

      if (data) {
        set((state) => ({
          ...state,
          processes: state.processes.map((p) =>
            p.id === process.id
              ? {
                  id: data.id,
                  agendaId: data.agenda_id,
                  counselorName: data.counselor_name,
                  processNumber: data.process_number,
                  processType: data.process_type,
                  stakeholders: data.stakeholders,
                  summary: data.summary,
                  voteType: data.vote_type || '',
                  mpcOpinionSummary: data.mpc_opinion_summary || '',
                  tceReportSummary: data.tce_report_summary || 'A definir',
                  hasViewVote: data.has_view_vote || false,
                  viewVoteSummary: data.view_vote_summary || '',
                  mpcSystemManifest: data.mpc_system_manifest || '',
                  pgcModifiedManifest: data.pgc_modified_manifest || '',
                  isPgcModified: data.is_pgc_modified || false,
                  position: data.order,
                  procuradorContas: data.procurador_contas || '',
                  observations: data.observations || '',
                  additionalNotes: '', // Campo não existente no banco, mas presente na interface
                  type: data.process_type || '',
                  number: data.process_number || '',
                  sessionType: '',
                  sessionNumber: 0,
                  vote: '',
                  created_at: data.created_at || new Date().toISOString(),
                  updated_at: data.updated_at || new Date().toISOString()
                }
              : p
          ),
        }));
      }
    } catch (error) {
      console.error('Error updating process:', error);
      throw error;
    }
  },

  deleteProcess: async (id) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('Você precisa estar autenticado para excluir um processo');
      }

      // Obter o processo a ser excluído para referência
      const process = get().processes.find(p => p.id === id);
      if (!process) {
        throw new Error('Processo não encontrado');
      }

      const { error } = await supabase
        .from('processes')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error('Não foi possível excluir o processo. Por favor, tente novamente.');
      }

      set((state) => ({
        ...state,
        processes: state.processes.filter((p) => p.id !== id),
      }));

      // Retornar o processo excluído para uso posterior
      return process;
    } catch (error) {
      console.error('Error deleting process:', error);
      throw error;
    }
  },

  updateUser: async (user) => {
    try {
      // Atualiza no banco de dados
      const { error } = await supabase
        .from('users')
        .update({
          name: user.name,
          email: user.email,
          role: user.role,
          registration: user.registration,
          token: user.token
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Atualiza o estado local
      set((state) => ({ ...state, user, auth: { ...state.auth, user } }));
    } catch (error) {
      console.error('Error updating user:', error);
      set((state) => ({ ...state, error: getErrorMessage(error) }));
      throw error;
    }
  },
  
  addSessionType: (type) =>
    set((state) => ({ ...state, sessionTypes: [...state.sessionTypes, type] })),
  
  removeSessionType: (type) =>
    set((state) => ({
      ...state,
      sessionTypes: state.sessionTypes.filter((t) => t !== type),
    })),

  addStakeholder: async (stakeholder) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('Você precisa estar autenticado para adicionar um interessado');
      }

      const { data, error } = await supabase
        .from('stakeholders')
        .insert([{
          ...stakeholder,
          user_id: session.user.id
        }])
        .select()
        .single();

      if (error) {
        throw new Error('Não foi possível adicionar o interessado. Por favor, tente novamente.');
      }

      if (data) {
        set((state) => ({ ...state, stakeholders: [...state.stakeholders, data] }));
      }
    } catch (error) {
      console.error('Error adding stakeholder:', error);
      throw error;
    }
  },

  updateStakeholder: async (stakeholder) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('Você precisa estar autenticado para atualizar um interessado');
      }

      const { error } = await supabase
        .from('stakeholders')
        .update({
          name: stakeholder.name,
          role: stakeholder.role,
          email: stakeholder.email
        })
        .eq('id', stakeholder.id);

      if (error) {
        throw new Error('Não foi possível atualizar o interessado. Por favor, tente novamente.');
      }

      set((state) => ({
        ...state,
        stakeholders: state.stakeholders.map((s) => (s.id === stakeholder.id ? stakeholder : s)),
      }));
    } catch (error) {
      console.error('Error updating stakeholder:', error);
      throw error;
    }
  },

  deleteStakeholder: async (id) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('Você precisa estar autenticado para excluir um interessado');
      }

      const { error } = await supabase
        .from('stakeholders')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error('Não foi possível excluir o interessado. Por favor, tente novamente.');
      }

      set((state) => ({
        ...state,
        stakeholders: state.stakeholders.filter((s) => s.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting stakeholder:', error);
      throw error;
    }
  },

  updateDocumentConfig: (config) =>
    set((state) => ({
      ...state,
      documentConfig: {
        ...state.documentConfig,
        ...config,
      },
    })),

  addProsecutor: (name) =>
    set((state) => ({ ...state, prosecutors: [...state.prosecutors, name] })),

  removeProsecutor: (name) =>
    set((state) => ({
      ...state,
      prosecutors: state.prosecutors.filter((prosecutor) => prosecutor !== name),
    })),

  login: async (email, password) => {
    try {
      set((state) => ({ ...state, auth: { ...state.auth, loading: true, error: null } }));

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          throw new Error('E-mail ou senha incorretos');
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('E-mail ou senha incorretos');
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        throw new Error('E-mail ou senha incorretos');
      }

      if (!userData) {
        throw new Error('E-mail ou senha incorretos');
      }

      set({
        auth: {
          isAuthenticated: true,
          isAnonymous: false,
          user: userData,
          loading: false,
          error: null,
        },
        user: userData,
      });
    } catch (error) {
      console.error('Login error:', error);
      set((state) => ({
        auth: {
          ...state.auth,
          isAuthenticated: false,
          isAnonymous: false,
          user: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Erro ao fazer login',
        },
      }));
      throw error;
    }
  },

  signup: async (userData) => {
    try {
      set((state) => ({ ...state, auth: { ...state.auth, loading: true, error: null } }));

      if (userData.token !== 'batmanmpc') {
        throw new Error('Token incorreto, procure a PGC');
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Falha ao criar usuário');
      }

      const userProfile = {
        id: authData.user.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        registration: userData.registration,
        token: userData.token,
      };

      const { error: profileError } = await supabase
        .from('users')
        .insert([userProfile]);

      if (profileError) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw profileError;
      }

      // Atualiza o estado com os dados do usuário
      set({
        auth: {
          isAuthenticated: true,
          isAnonymous: false,
          user: userProfile,
          loading: false,
          error: null,
        },
        user: userProfile,
      });
    } catch (error) {
      console.error('Signup error:', error);
      set((state) => ({
        auth: {
          ...state.auth,
          loading: false,
          error: getErrorMessage(error),
        },
      }));
      throw error;
    }
  },

  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      set({
        auth: {
          isAuthenticated: false,
          isAnonymous: false,
          user: null,
          loading: false,
          error: null,
        },
        user: {
          id: '',
          name: '',
          email: '',
          role: '',
          registration: '',
          token: '',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
      set((state) => ({
        auth: {
          ...state.auth,
          error: getErrorMessage(error),
        },
      }));
    }
  },

  resetPassword: async (email: string) => {
    try {
      set((state) => ({ ...state, auth: { ...state.auth, loading: true, error: null } }));
      
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;

      set((state) => ({
        auth: { ...state.auth, loading: false, error: null },
      }));
    } catch (error) {
      console.error('Password reset error:', error);
      set((state) => ({
        auth: {
          ...state.auth,
          loading: false,
          error: getErrorMessage(error),
        },
      }));
    }
  },

  updatePassword: async (newPassword: string) => {
    try {
      set((state) => ({ ...state, auth: { ...state.auth, loading: true, error: null } }));
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      set((state) => ({
        auth: { ...state.auth, loading: false, error: null },
      }));
    } catch (error) {
      console.error('Password update error:', error);
      set((state) => ({
        auth: {
          ...state.auth,
          loading: false,
          error: getErrorMessage(error),
        },
      }));
    }
  },

  initializeAuth: async () => {
    try {
      set((state) => ({ ...state, auth: { ...state.auth, loading: true, error: null } }));
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (session?.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userError) throw userError;

        if (userData) {
          set({
            auth: {
              isAuthenticated: true,
              isAnonymous: false,
              user: userData,
              loading: false,
              error: null,
            },
            user: userData,
          });
          return;
        }
      }
      
      set((state) => ({
        auth: {
          ...state.auth,
          isAuthenticated: false,
          isAnonymous: false,
          user: null,
          loading: false,
          error: null,
        },
      }));
    } catch (error) {
      console.error('Auth initialization error:', error);
      set((state) => ({
        auth: {
          ...state.auth,
          isAuthenticated: false,
          isAnonymous: false,
          user: null,
          loading: false,
          error: getErrorMessage(error),
        },
      }));
    }
  },

  reorderProcesses: async (agendaId, deletedPosition) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('Você precisa estar autenticado para renumerar processos');
      }

      // Obter todos os processos da mesma agenda que têm posição maior que a do processo excluído
      const processesToUpdate = get().processes.filter(
        p => p.agendaId === agendaId && (p.position || 0) > deletedPosition
      );

      // Atualizar cada processo subtraindo 1 da posição
      for (const process of processesToUpdate) {
        const newPosition = (process.position || 0) - 1;
        
        const { error } = await supabase
          .from('processes')
          .update({ order: newPosition })
          .eq('id', process.id);

        if (error) {
          console.error('Erro ao renumerar processo:', error);
        }
      }

      // Atualizar o estado local
      set((state) => ({
        ...state,
        processes: state.processes.map(p => 
          p.agendaId === agendaId && (p.position || 0) > deletedPosition
            ? { ...p, position: (p.position || 0) - 1 }
            : p
        )
      }));

    } catch (error) {
      console.error('Erro ao renumerar processos:', error);
      throw error;
    }
  },
}));

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export default useStore;
