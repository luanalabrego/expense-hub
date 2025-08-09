import { Link, useLocation } from 'react-router-dom';
import { useUIStore } from '../stores/ui';
import { useAuthStore } from '../stores/auth';
import { cn } from '../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Solicitações', href: '/requests', icon: '📝' },
  { name: 'Fornecedores', href: '/vendors', icon: '🏢' },
  { name: 'Centros de Custo', href: '/cost-centers', icon: '💼' },
  { name: 'Categorias', href: '/categories', icon: '📂' },
  { name: 'Orçamentos', href: '/budgets', icon: '💰' },
  { name: 'Documentos', href: '/documents', icon: '📄' },
];

const adminNavigation = [
  { name: 'Usuários', href: '/admin/users', icon: '👥' },
  { name: 'Políticas', href: '/policies', icon: '⚙️' },
  { name: 'Auditoria', href: '/admin/audit', icon: '🔍' },
];

export const Sidebar = () => {
  const location = useLocation();
  const { sidebarOpen, sidebarCollapsed } = useUIStore();
  const { hasAnyRole } = useAuthStore();

  if (!sidebarOpen) return null;

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300",
      sidebarCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="text-2xl">💳</div>
            {!sidebarCollapsed && (
              <span className="ml-2 text-lg font-semibold text-gray-900">
                Aprovações
              </span>
            )}
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-blue-100 text-blue-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <span className="text-lg">{item.icon}</span>
                {!sidebarCollapsed && (
                  <span className="ml-3">{item.name}</span>
                )}
              </Link>
            );
          })}

          {/* Navegação admin */}
          {hasAnyRole(['admin', 'finance']) && (
            <>
              <div className="pt-4">
                {!sidebarCollapsed && (
                  <div className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Administração
                  </div>
                )}
              </div>
              {adminNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-blue-100 text-blue-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {!sidebarCollapsed && (
                      <span className="ml-3">{item.name}</span>
                    )}
                  </Link>
                );
              })}
            </>
          )}
        </nav>
      </div>
    </div>
  );
};

