import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HashRouter } from 'react-router-dom';
import { queryClient } from './lib/react-query';
import { AppRoutes } from './routes';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AuthProvider>
          <div className="min-h-screen bg-background">
            <AppRoutes />
          </div>
          <ReactQueryDevtools initialIsOpen={false} />
        </AuthProvider>
      </HashRouter>
    </QueryClientProvider>
  );
}

export default App;

