import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';

export const LoginPage = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      console.error(error);
      setError('Credenciais inválidas');
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-4xl flex flex-col md:flex-row overflow-hidden p-0 gap-0">
        <div className="flex items-center justify-center w-full md:w-1/2 bg-gradient-to-b from-black to-pink-900 p-6">
          <h1 className="text-4xl font-bold text-white">Expense Hub</h1>
        </div>
        <div className="w-full md:w-1/2 p-8 space-y-6 bg-white">
          <h1 className="text-2xl font-semibold text-center text-pink-900">Seja Bem Vindo</h1>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" data-tooltip="Informe seu e-mail corporativo">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" data-tooltip="Digite sua senha de acesso">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-pink-900 hover:bg-pink-950 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <div className="text-right">
            <a href="#" className="text-sm text-pink-900 hover:underline">
              Esqueceu sua senha?
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
