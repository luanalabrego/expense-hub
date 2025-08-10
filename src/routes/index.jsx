import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { RequestsPage } from '../pages/RequestsPage';
import { VendorsPage } from '../pages/VendorsPage';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="requests" replace />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="vendors" element={<VendorsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

