import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { RequestsPage } from '../pages/RequestsPage';
import { RequestDetailsPage } from '../pages/RequestDetailsPage';
import { VendorsPage } from '../pages/VendorsPage';
import { VendorApprovalsPage } from '../pages/VendorApprovalsPage';
import { VendorDossierPage } from '../pages/VendorDossierPage';
import { UsersPage } from '../pages/UsersPage';
import { CostCentersPage } from '../pages/CostCentersPage';
import { FinancialApprovalsPage } from '../pages/FinancialApprovalsPage';
import { OwnerApprovalsPage } from '../pages/OwnerApprovalsPage';
import { DirectorApprovalsPage } from '../pages/DirectorApprovalsPage';
import { CfoApprovalsPage } from '../pages/CfoApprovalsPage';
import { CeoApprovalsPage } from '../pages/CeoApprovalsPage';
import { PaymentManagementPage } from '../pages/PaymentManagementPage';
import { ReportsPage } from '../pages/ReportsPage';
import { useAuth } from '../contexts/AuthContext';
import { BudgetsPage } from '../pages/BudgetsPage';

export const AppRoutes = () => {
  const { hasPageAccess } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="requests" replace />} />
        <Route
          path="requests"
          element={hasPageAccess('requests') ? <RequestsPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="requests/:id"
          element={hasPageAccess('requests') ? <RequestDetailsPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="vendors"
          element={hasPageAccess('vendors') ? <VendorsPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="vendors/:id"
          element={hasPageAccess('vendors') ? <VendorDossierPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="cost-centers"
          element={
            hasPageAccess('cost-centers') ? <CostCentersPage /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="vendor-approvals"
          element={
            hasPageAccess('vendorApprovals') ? (
              <VendorApprovalsPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="owner-approvals"
          element={
            hasPageAccess('ownerApprovals') ? (
              <OwnerApprovalsPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="financial-approvals"
          element={
            hasPageAccess('financialApprovals') ? (
              <FinancialApprovalsPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="director-approvals"
          element={
            hasPageAccess('directorApprovals') ? (
              <DirectorApprovalsPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="cfo-approvals"
          element={
            hasPageAccess('cfoApprovals') ? (
              <CfoApprovalsPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="ceo-approvals"
          element={
            hasPageAccess('ceoApprovals') ? (
              <CeoApprovalsPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="payments"
          element={
            hasPageAccess('payments') ? (
              <PaymentManagementPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="reports"
          element={
            hasPageAccess('reports') ? (
              <ReportsPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="budgets"
          element={
            hasPageAccess('budgets') ? (
              <BudgetsPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="users"
          element={hasPageAccess('users') ? <UsersPage /> : <Navigate to="/" replace />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

