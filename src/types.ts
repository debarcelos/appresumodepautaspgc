export interface Agenda {
  id: string;
  type: string;
  number: string;
  date: string;
  isFinished: boolean;
}

export type Process = {
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
  pgcModifiedManifest: string;
  isPgcModified: boolean;
  position: number;
  additionalNotes: string;
  procuradorContas: string;
  observations: string;
  type: string;
  number: string;
  sessionType: string;
  sessionNumber: number;
  vote: string;
  created_at: string;
  updated_at: string;
};

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