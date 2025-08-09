import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuthStore } from '../stores/auth';
import { useUIStore } from '../stores/ui';
import { Button } from './ui/button';

export const Header = () => {
  const { user } = useAuthStore();
  const { toggleSidebar, toggleSidebarCollapse } = useUIStore();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4">
      {/* Controles da sidebar */}
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="lg:hidden"
        >
          ☰
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebarCollapse}
          className="hidden lg:block"
        >
          ☰
        </Button>
      </div>

      {/* Informações do usuário */}
      <div className="flex items-center space-x-4">
        <div className="text-sm">
          <div className="font-medium text-gray-900">{user?.name}</div>
          <div className="text-gray-500">{user?.email}</div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
        >
          Sair
        </Button>
      </div>
    </header>
  );
};

