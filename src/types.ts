export interface Agenda {
  id: string;
  type: string;
  number: string;
  date: string;
  isFinished: boolean;
}

export interface Process {
  id: string;
  agendaId: string;
  counselorName: string;
  processNumber: string;
  processType: string;
  stakeholders: string;
  summary: string;
  voteType: string;
  mpcOpinionSummary: string;
  tceReportSummary: string;
  hasViewVote: boolean;
  viewVoteSummary: string;
  mpcSystemManifest: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  registration: string;
  token: string;
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  email: string;
}

export interface DocumentConfig {
  header: {
    content: string;
    alignment: 'left' | 'center' | 'right';
  };
  footer: {
    content: string;
    alignment: 'left' | 'center' | 'right';
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  isAnonymous: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}