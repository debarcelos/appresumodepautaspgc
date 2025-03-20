import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, FileText, Settings, LogOut } from 'lucide-react';
import { useStore } from '../store';

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, auth } = useStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Pautas', href: '/agendas', icon: Calendar },
    { name: 'Processos', href: '/processes', icon: FileText },
    { name: 'Configurações', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Fixed navbar */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end items-center h-16 w-full">
            {auth.user && (
              <div className="flex items-center">
                <div className="text-sm text-gray-700 mr-6">
                  {auth.user.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-600 hover:text-red-900 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main layout with sidebar and content */}
      <div className="pt-16 flex min-h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg z-20">
          <nav className="sticky top-0 pt-4">
            {/* Título do App */}
            <div className="text-center pt-5 pb-3 px-2">
              <h1 className="text-lg font-bold text-gray-900">
                Resumo de Pauta - PGC - Online
              </h1>
            </div>
            {/* Logo do MPC-GO */}
            <div className="flex justify-center my-6">
              <img 
                src="https://portal.tce.go.gov.br/documents/129288/206893/Logo+MPC-GO/5088e3d6-1681-4376-80b3-2d94d7c15d3a?t=1571833665000" 
                alt="Logo MPC-GO" 
                className="h-20 w-auto"
              />
            </div>
            <div className="space-y-1 px-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      location.pathname === item.href
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center rounded-md px-2 py-2 text-sm font-medium`}
                  >
                    <Icon
                      className={`${
                        location.pathname === item.href
                          ? 'text-gray-900'
                          : 'text-gray-400 group-hover:text-gray-500'
                      } mr-3 h-5 w-5 flex-shrink-0`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
