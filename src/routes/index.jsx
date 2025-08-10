import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { RequestsPage } from '../pages/RequestsPage';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<RequestsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

