import { create } from 'zustand';
import { Agenda, Process, User, Stakeholder, DocumentConfig, AuthState } from './types';
import { supabase, fetchWithRetry } from './lib/supabase';

interface Store {
  agendas: Agenda[];
  processes: Process[];
  user: User;
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
  deleteProcess: (id: string) => Promise<void>;
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
  loginAnonymously: () => void;
  loadInitialData: () => Promise<void>;
}

const defaultHeader = `<div style="text-align: center;">
  <img src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=100&h=100&fit=crop&crop=entropy&auto=format" width="100" height="100" style="object-fit: contain;">
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

  loadInitialData: async () => {
    try {
      set({ isLoading: true, error: null });

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        set({ isLoading: false });
        return;
      }

      const [agendasResult, processesResult, stakeholdersResult] = await Promise.all([
        fetchWithRetry(() => 
          supabase
            .from('agendas')
            .select('*')
            .order('date', { ascending: false })
        ),
        fetchWithRetry(() =>
          supabase
            .from('processes')
            .select('*')
            .order('created_at', { ascending: false })
        ),
        fetchWithRetry(() =>
          supabase
            .from('stakeholders')
            .select('*')
            .eq('user_id', session.user.id)
            .order('name')
        )
      ]);

      if (agendasResult.error) throw agendasResult.error;
      if (processesResult.error) throw processesResult.error;
      if (stakeholdersResult.error) throw stakeholdersResult.error;

      const mappedAgendas = (agendasResult.data || []).map(agenda => ({
        id: agenda.id,
        type: agenda.type,
        number: agenda.number,
        date: agenda.date,
        isFinished: agenda.is_finished
      }));

      const mappedProcesses = (processesResult.data || []).map(process => ({
        id: process.id,
        agendaId: process.agenda_id,
        counselorName: process.counselor_name,
        processNumber: process.process_number,
        processType: process.process_type,
        stakeholders: process.stakeholders,
        summary: process.summary,
        voteType: process.vote_type,
        mpcOpinionSummary: process.mpc_opinion_summary,
        tceReportSummary: process.tce_report_summary,
        hasViewVote: process.has_view_vote,
        viewVoteSummary: process.view_vote_summary,
        mpcSystemManifest: process.mpc_system_manifest
      }));

      set({
        agendas: mappedAgendas,
        processes: mappedProcesses,
        stakeholders: stakeholdersResult.data || [],
        isLoading: false,
        error: null
      });

    } catch (error) {
      console.error('Error loading initial data:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar dados iniciais'
      });
      throw error;
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

      set((state) => ({ agendas: [...state.agendas, newAgenda] }));
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
          vote_type: process.voteType,
          mpc_opinion_summary: process.mpcOpinionSummary,
          tce_report_summary: process.tceReportSummary,
          has_view_vote: process.hasViewVote,
          view_vote_summary: process.viewVoteSummary,
          mpc_system_manifest: process.mpcSystemManifest,
          user_id: session.user.id
        }])
        .select()
        .single();

      if (error) {
        throw new Error('Não foi possível adicionar o processo. Por favor, tente novamente.');
      }

      if (data) {
        const newProcess = {
          id: data.id,
          agendaId: data.agenda_id,
          counselorName: data.counselor_name,
          processNumber: data.process_number,
          processType: data.process_type,
          stakeholders: data.stakeholders,
          summary: data.summary,
          voteType: data.vote_type,
          mpcOpinionSummary: data.mpc_opinion_summary,
          tceReportSummary: data.tce_report_summary,
          hasViewVote: data.has_view_vote,
          viewVoteSummary: data.view_vote_summary,
          mpcSystemManifest: data.mpc_system_manifest
        };
        set((state) => ({ processes: [...state.processes, newProcess] }));
      }
    } catch (error) {
      console.error('Error adding process:', error);
      throw error;
    }
  },

  addProcesses: async (processes) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('Você precisa estar autenticado para adicionar processos');
      }

      // Split processes into chunks of 50 to avoid potential payload size limits
      const chunkSize = 50;
      const chunks = [];
      for (let i = 0; i < processes.length; i += chunkSize) {
        chunks.push(processes.slice(i, i + chunkSize));
      }

      const allNewProcesses = [];

      for (const chunk of chunks) {
        const processesToInsert = chunk.map(process => ({
          agenda_id: process.agendaId,
          counselor_name: process.counselorName,
          process_number: process.processNumber,
          process_type: process.processType,
          stakeholders: process.stakeholders,
          summary: process.summary,
          vote_type: process.voteType || '',
          mpc_opinion_summary: process.mpcOpinionSummary || '',
          tce_report_summary: process.tceReportSummary || '',
          has_view_vote: process.hasViewVote || false,
          view_vote_summary: process.viewVoteSummary || '',
          mpc_system_manifest: process.mpcSystemManifest || '',
          user_id: session.user.id
        }));

        const { data, error } = await supabase
          .from('processes')
          .insert(processesToInsert)
          .select();

        if (error) {
          throw new Error('Não foi possível adicionar os processos. Por favor, tente novamente.');
        }

        if (data) {
          const newProcesses = data.map(process => ({
            id: process.id,
            agendaId: process.agenda_id,
            counselorName: process.counselor_name,
            processNumber: process.process_number,
            processType: process.process_type,
            stakeholders: process.stakeholders,
            summary: process.summary,
            voteType: process.vote_type,
            mpcOpinionSummary: process.mpc_opinion_summary,
            tceReportSummary: process.tce_report_summary,
            hasViewVote: process.has_view_vote,
            viewVoteSummary: process.view_vote_summary,
            mpcSystemManifest: process.mpc_system_manifest
          }));

          allNewProcesses.push(...newProcesses);
        }
      }

      set((state) => ({ processes: [...state.processes, ...allNewProcesses] }));
    } catch (error) {
      console.error('Error adding processes:', error);
      throw error;
    }
  },

  updateProcess: async (process) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('Você precisa estar autenticado para atualizar um processo');
      }

      const { error } = await supabase
        .from('processes')
        .update({
          agenda_id: process.agendaId,
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
          mpc_system_manifest: process.mpcSystemManifest
        })
        .eq('id', process.id);

      if (error) {
        throw new Error('Não foi possível atualizar o processo. Por favor, tente novamente.');
      }

      set((state) => ({
        processes: state.processes.map((p) => (p.id === process.id ? process : p)),
      }));
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

      const { error } = await supabase
        .from('processes')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error('Não foi possível excluir o processo. Por favor, tente novamente.');
      }

      set((state) => ({
        processes: state.processes.filter((p) => p.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting process:', error);
      throw error;
    }
  },

  updateUser: (user) => set({ user }),
  
  addSessionType: (type) =>
    set((state) => ({ sessionTypes: [...state.sessionTypes, type] })),
  
  removeSessionType: (type) =>
    set((state) => ({
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
        set((state) => ({ stakeholders: [...state.stakeholders, data] }));
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
        stakeholders: state.stakeholders.filter((s) => s.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting stakeholder:', error);
      throw error;
    }
  },

  updateDocumentConfig: (config) =>
    set((state) => ({
      documentConfig: {
        ...state.documentConfig,
        ...config,
      },
    })),

  addProsecutor: (name) =>
    set((state) => ({ prosecutors: [...state.prosecutors, name] })),

  removeProsecutor: (name) =>
    set((state) => ({
      prosecutors: state.prosecutors.filter((p) => p !== name),
    })),

  loginAnonymously: () => {
    set({
      auth: {
        isAuthenticated: true,
        isAnonymous: true,
        user: null,
        loading: false,
        error: null,
      },
    });
  },

  login: async (email: string, password: string) => {
    try {
      set((state) => ({ auth: { ...state.auth, loading: true, error: null } }));

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
      set((state) => ({ auth: { ...state.auth, loading: true, error: null } }));

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
      set((state) => ({ auth: { ...state.auth, loading: true, error: null } }));
      
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
      set((state) => ({ auth: { ...state.auth, loading: true, error: null } }));
      
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
      set((state) => ({ auth: { ...state.auth, loading: true, error: null } }));
      
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
}));

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export default useStore;
