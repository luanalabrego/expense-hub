import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUIStore } from '../stores/ui';
import { cn } from '../lib/utils';

export const Layout = () => {
  const { sidebarOpen, sidebarCollapsed } = useUIStore();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Conteúdo principal */}
      <div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          sidebarOpen && !sidebarCollapsed && "ml-64",
          sidebarOpen && sidebarCollapsed && "ml-16",
          !sidebarOpen && "ml-0"
        )}
      >
        {/* Header */}
        <Header />
        
        {/* Conteúdo da página */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

