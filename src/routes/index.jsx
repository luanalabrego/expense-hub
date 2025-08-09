import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';

// Páginas
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { RequestsPage } from '../pages/RequestsPage';
import { NewRequestPage } from '../pages/NewRequestPage';
import { RequestDetailPage } from '../pages/RequestDetailPage';
import { VendorsPage } from '../pages/VendorsPage';
import { CostCentersPage } from '../pages/CostCentersPage';
import { CategoriesPage } from '../pages/CategoriesPage';
import { BudgetsPage } from '../pages/BudgetsPage';
import { PoliciesPage } from '../pages/PoliciesPage';
import { DocumentsPage } from '../pages/DocumentsPage';
import { AuditPage } from '../pages/AuditPage';
import { UsersPage } from '../pages/UsersPage';
import { SeedDataPage } from '../pages/SeedDataPage';
import { ProfilePage } from '../pages/ProfilePage';
import { SettingsPage } from '../pages/SettingsPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { ImportExportPage } from '../pages/ImportExportPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Rota de login */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Todas as rotas agora são públicas */}
      <Route path="/" element={<Layout />}>
        {/* Redirect da raiz para dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Dashboard */}
        <Route path="dashboard" element={<DashboardPage />} />
        
        {/* Solicitações */}
        <Route path="requests" element={<RequestsPage />} />
        <Route path="requests/new" element={<NewRequestPage />} />
        <Route path="requests/:id" element={<RequestDetailPage />} />
        
        {/* Cadastros básicos */}
        <Route path="vendors" element={<VendorsPage />} />
        <Route path="cost-centers" element={<CostCentersPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        
        {/* Orçamentos */}
        <Route path="budgets" element={<BudgetsPage />} />
        
        {/* Políticas */}
        <Route path="policies" element={<PoliciesPage />} />
        
        {/* Documentos */}
        <Route path="documents" element={<DocumentsPage />} />
        
        {/* Notificações */}
        <Route path="notifications" element={<NotificationsPage />} />
        
        {/* Importação/Exportação */}
        <Route path="import-export" element={<ImportExportPage />} />
        
        {/* Administração */}
        <Route path="admin/users" element={<UsersPage />} />
        <Route path="admin/audit" element={<AuditPage />} />
        <Route path="admin/seed-data" element={<SeedDataPage />} />
        
        {/* Perfil e configurações */}
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      
      {/* Página 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

