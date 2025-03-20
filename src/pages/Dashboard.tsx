import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis, 
  Treemap
} from 'recharts';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';

// Componente para seções de gráficos colapsáveis
const ChartSection = ({ title, children }: { title: string, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div 
        className="flex justify-between items-center cursor-pointer" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </div>
      {isOpen && <div className="mt-4">{children}</div>}
    </div>
  );
};

// Cores para os gráficos
const COLORS = [
  '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

function Dashboard() {
  const { agendas, processes, loadInitialData, isLoading, error } = useStore();

  useEffect(() => {
    loadInitialData().catch(console.error);
  }, [loadInitialData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erro ao carregar dados: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-red-600 hover:text-red-800"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // Dados para gráfico de tipo de processo
  const processTypeData = processes.reduce((acc: any[], process) => {
    const existingType = acc.find((item) => item.type === process.processType);
    if (existingType) {
      existingType.count += 1;
    } else if (process.processType) {
      acc.push({ type: process.processType || 'Não especificado', count: 1 });
    }
    return acc;
  }, []);

  // Dados para gráfico de tipo de voto
  const voteTypeData = processes.reduce((acc: any[], process) => {
    const existingType = acc.find((item) => item.name === process.voteType);
    if (existingType) {
      existingType.value += 1;
    } else if (process.voteType) {
      acc.push({ name: process.voteType || 'Não especificado', value: 1 });
    }
    return acc;
  }, []);

  // Dados para gráfico de processos por conselheiro
  const counselorData = processes.reduce((acc: any[], process) => {
    const existingCounselor = acc.find((item) => item.name === process.counselorName);
    if (existingCounselor) {
      existingCounselor.value += 1;
    } else if (process.counselorName) {
      acc.push({ name: process.counselorName, value: 1 });
    }
    return acc;
  }, []);

  // Dados para gráfico de processos com voto vista
  const viewVoteData = [
    { name: 'Com Voto Vista', value: processes.filter(p => p.hasViewVote).length },
    { name: 'Sem Voto Vista', value: processes.filter(p => !p.hasViewVote).length }
  ];

  // Dados para gráfico de status das pautas
  const agendaStatusData = [
    { name: 'Finalizadas', value: agendas.filter(a => a.isFinished).length },
    { name: 'Em Andamento', value: agendas.filter(a => !a.isFinished).length }
  ];

  // Dados para gráfico de evolução temporal
  const timelineData = agendas.reduce((acc: any[], agenda) => {
    const date = new Date(agenda.date).toLocaleDateString('pt-BR');
    const existingDate = acc.find(item => item.date === date);
    
    if (existingDate) {
      existingDate.count += processes.filter(p => p.agendaId === agenda.id).length;
    } else {
      acc.push({
        date,
        count: processes.filter(p => p.agendaId === agenda.id).length
      });
    }
    return acc;
  }, []).sort((a: any, b: any) => {
    const dateA = new Date(a.date.split('/').reverse().join('-'));
    const dateB = new Date(b.date.split('/').reverse().join('-'));
    return dateA.getTime() - dateB.getTime();
  });

  // Dados para gráfico de análise de mérito
  const meritAnalysisData = timelineData.map((item: any) => {
    const date = item.date;
    const totalForDate = processes.filter(p => {
      const agendaForProcess = agendas.find(a => a.id === p.agendaId);
      return agendaForProcess && new Date(agendaForProcess.date).toLocaleDateString('pt-BR') === date;
    });
    
    const withoutMeritAnalysis = totalForDate.filter(p => 
      p.voteType === 'não houve análise de mérito pelo MPC'
    ).length;
    
    return {
      date,
      'Com Análise': totalForDate.length - withoutMeritAnalysis,
      'Sem Análise': withoutMeritAnalysis
    };
  });

  // Dados para gráfico de radar
  const radarData = counselorData.map((item: any) => {
    const counselor = item.name;
    const totalProcesses = item.value;
    
    const counselorProcesses = processes.filter(p => p.counselorName === counselor);
    const withViewVote = counselorProcesses.filter(p => p.hasViewVote).length;
    const convergent = counselorProcesses.filter(p => p.voteType === 'convergente').length;
    const divergent = counselorProcesses.filter(p => p.voteType === 'divergente').length;
    
    return {
      counselor,
      'Total': totalProcesses,
      'Com Voto Vista': withViewVote,
      'Convergente': convergent,
      'Divergente': divergent
    };
  });

  // Calcular KPIs
  const completionRate = agendas.length > 0 
    ? (agendas.filter(a => a.isFinished).length / agendas.length * 100).toFixed(1) 
    : '0';
    
  const withMpcManifest = processes.filter(p => p.mpcSystemManifest && p.mpcSystemManifest.trim() !== '').length;
  const mpcManifestRate = processes.length > 0 
    ? (withMpcManifest / processes.length * 100).toFixed(1) 
    : '0';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        
        {/* KPIs */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-medium text-gray-900">Total de Pautas</h3>
            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {agendas.length}
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-medium text-gray-900">Total de Processos</h3>
            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {processes.length}
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-medium text-gray-900">Média de Processos por Pauta</h3>
            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {agendas.length ? (processes.length / agendas.length).toFixed(1) : '0'}
            </p>
          </div>
        </div>

        {/* KPIs adicionais */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-medium text-gray-900">Taxa de Conclusão de Pautas</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {completionRate}%
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-medium text-gray-900">Processos com Manifestação MPC</h3>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {mpcManifestRate}%
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-medium text-gray-900">Processos com Voto Vista</h3>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {processes.length ? ((processes.filter(p => p.hasViewVote).length / processes.length) * 100).toFixed(1) : '0'}%
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico original */}
      <ChartSection title="Distribuição por Tipo de Processo">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={processTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartSection>

      {/* Gráfico de Pizza - Distribuição de Votos por Tipo */}
      <ChartSection title="Distribuição de Votos por Tipo">
        <div className="h-80 flex justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={voteTypeData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {voteTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartSection>

      {/* Gráfico de Linha - Evolução Temporal de Processos */}
      <ChartSection title="Evolução Temporal de Processos">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#4f46e5" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartSection>

      {/* Gráfico de Barras - Processos por Conselheiro */}
      <ChartSection title="Processos por Conselheiro">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={counselorData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartSection>

      {/* Gráfico de Rosca - Processos com Voto Vista */}
      <ChartSection title="Processos com Voto Vista">
        <div className="h-80 flex justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={viewVoteData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {viewVoteData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartSection>

      {/* Gráfico de Barras Horizontais - Status das Pautas */}
      <ChartSection title="Status das Pautas">
        <div className="h-80 flex justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={agendaStatusData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartSection>

      {/* Gráfico de Área - Análise de Mérito pelo MPC */}
      <ChartSection title="Análise de Mérito pelo MPC ao Longo do Tempo">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={meritAnalysisData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="Com Análise" stackId="1" stroke="#4f46e5" fill="#4f46e5" />
              <Area type="monotone" dataKey="Sem Análise" stackId="1" stroke="#ef4444" fill="#ef4444" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartSection>

      {/* Gráfico de Radar - Comparação Multidimensional */}
      <ChartSection title="Análise Multidimensional por Conselheiro">
        <div className="h-96 flex justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="counselor" />
              <PolarRadiusAxis />
              <Radar name="Total" dataKey="Total" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
              <Radar name="Com Voto Vista" dataKey="Com Voto Vista" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
              <Radar name="Convergente" dataKey="Convergente" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Radar name="Divergente" dataKey="Divergente" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </ChartSection>

      {/* Gráfico de Bolhas - Relação entre Quantidade de Processos, Tipo e Conselheiro */}
      <ChartSection title="Relação entre Processos, Tipo e Conselheiro">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid />
              <XAxis type="category" dataKey="counselor" name="Conselheiro" />
              <YAxis type="category" dataKey="type" name="Tipo de Processo" />
              <ZAxis type="number" dataKey="count" range={[100, 1000]} name="Quantidade" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="Processos" data={
                processes.reduce((acc: any[], process) => {
                  const key = `${process.counselorName}-${process.processType}`;
                  const existing = acc.find(item => item.key === key);
                  if (existing) {
                    existing.count += 1;
                  } else if (process.counselorName && process.processType) {
                    acc.push({
                      key,
                      counselor: process.counselorName,
                      type: process.processType,
                      count: 1
                    });
                  }
                  return acc;
                }, [])
              } fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </ChartSection>
    </div>
  );
}

export default Dashboard;
