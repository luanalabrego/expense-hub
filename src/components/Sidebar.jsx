import { Link, useLocation } from 'react-router-dom';
import { useUIStore } from '../stores/ui';
import { cn } from '../lib/utils';
import { ROUTES } from '../constants';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Solicitações', href: '/requests', icon: '📝', page: 'requests' },
  { name: 'Fornecedores', href: '/vendors', icon: '🏢', page: 'vendors' },
  { name: 'Centros de Custo', href: '/cost-centers', icon: '💰', page: 'cost-centers' },
  { name: 'Aprovação Forn.', href: '/vendor-approvals', icon: '✅', page: 'vendorApprovals' },
    { name: 'Revisão Contratos', href: '/contract-review', icon: '📑', page: 'contractReview' },
    { name: 'Monitor Contábil', href: '/accounting-monitor', icon: '📚', page: 'accountingMonitor' },
    { name: 'Aprov. Owner', href: '/owner-approvals', icon: '🧾', page: 'ownerApprovals' },
    { name: 'Aprov. FP&A', href: '/financial-approvals', icon: '💸', page: 'financialApprovals' },
  { name: 'Aprov. Diretor', href: '/director-approvals', icon: '🧑‍💼', page: 'directorApprovals' },
  { name: 'Aprov. CFO', href: '/cfo-approvals', icon: '💼', page: 'cfoApprovals' },
  { name: 'Aprov. CEO', href: '/ceo-approvals', icon: '🏛️', page: 'ceoApprovals' },
  { name: 'Pagamentos', href: '/payments', icon: '💳', page: 'payments' },
  { name: 'Relatórios', href: '/reports', icon: '📊', page: 'reports' },
  { name: 'Orçamento', href: '/budgets', icon: '🗓️', page: 'budgets' },
  { name: 'Solic. Orçamentos', href: '/budget-requests', icon: '📄', page: 'budgetRequests' },
  { name: 'Usuários', href: '/users', icon: '👥', page: 'users' },
];

export const Sidebar = () => {
  const location = useLocation();
  const { sidebarOpen, sidebarCollapsed } = useUIStore();
  const { hasPageAccess } = useAuth();

  if (!sidebarOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
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
          {navigation.filter((item) => hasPageAccess(item.page)).map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <span className="text-lg">{item.icon}</span>
                {!sidebarCollapsed && (
                  <span className="ml-3">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

