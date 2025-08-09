import { useState } from 'react';
import { 
  Database, 
  Play, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Users,
  Building,
  FolderOpen,
  Tag,
  Shield,
  DollarSign,
  FileText,
  Bell,
  Activity,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { seedDatabase, clearSeedData } from '../utils/seedData';
import { useAuthStore } from '../stores/auth';

export const SeedDataPage = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [seedResult, setSeedResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const { hasAnyRole } = useAuthStore();

  // Verificar se o usuário tem permissão
  if (!hasAnyRole(['admin'])) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Apenas administradores podem acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setError(null);
    setSeedResult(null);
    setProgress(0);

    try {
      // Simular progresso
      const progressSteps = [
        { step: 'Criando usuários...', progress: 10 },
        { step: 'Criando fornecedores...', progress: 25 },
        { step: 'Criando centros de custo...', progress: 40 },
        { step: 'Criando categorias...', progress: 55 },
        { step: 'Criando políticas...', progress: 70 },
        { step: 'Criando orçamentos...', progress: 85 },
        { step: 'Criando solicitações...', progress: 95 },
        { step: 'Finalizando...', progress: 100 },
      ];

      for (const { step, progress: stepProgress } of progressSteps) {
        console.log(step);
        setProgress(stepProgress);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const result = await seedDatabase();
      setSeedResult(result);
      
    } catch (err) {
      console.error('Erro ao popular banco:', err);
      setError(err.message || 'Erro desconhecido ao popular banco de dados');
    } finally {
      setIsSeeding(false);
      setProgress(0);
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('Tem certeza que deseja limpar todos os dados de demonstração? Esta ação não pode ser desfeita.')) {
      return;
    }

    setIsClearing(true);
    setError(null);
    setSeedResult(null);

    try {
      await clearSeedData();
      setSeedResult({
        success: true,
        message: 'Dados de demonstração removidos com sucesso!',
      });
    } catch (err) {
      console.error('Erro ao limpar dados:', err);
      setError(err.message || 'Erro desconhecido ao limpar dados');
    } finally {
      setIsClearing(false);
    }
  };

  const seedDataInfo = [
    {
      icon: Users,
      title: 'Usuários',
      count: 7,
      description: 'Admin, Finance, Approvers, Requesters e Viewer',
      color: 'text-blue-600',
    },
    {
      icon: Building,
      title: 'Fornecedores',
      count: 5,
      description: 'Empresas de tecnologia, escritório, facilities, marketing e jurídico',
      color: 'text-green-600',
    },
    {
      icon: FolderOpen,
      title: 'Centros de Custo',
      count: 5,
      description: 'TI, RH, Marketing, Operações e Administrativo',
      color: 'text-purple-600',
    },
    {
      icon: Tag,
      title: 'Categorias',
      count: 7,
      description: 'Software, material, consultoria, marketing, equipamentos, treinamento e viagens',
      color: 'text-orange-600',
    },
    {
      icon: Shield,
      title: 'Políticas de Aprovação',
      count: 4,
      description: 'Políticas por valor e categoria específica',
      color: 'text-red-600',
    },
    {
      icon: DollarSign,
      title: 'Orçamentos',
      count: 3,
      description: 'Orçamentos anuais e trimestrais por centro de custo',
      color: 'text-emerald-600',
    },
    {
      icon: FileText,
      title: 'Solicitações',
      count: 50,
      description: 'Solicitações com diferentes status e valores',
      color: 'text-indigo-600',
    },
    {
      icon: Bell,
      title: 'Notificações',
      count: 3,
      description: 'Notificações de aprovação, resposta e alerta orçamentário',
      color: 'text-pink-600',
    },
    {
      icon: Activity,
      title: 'Logs de Auditoria',
      count: 3,
      description: 'Logs de login, criação e aprovação',
      color: 'text-gray-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dados de Demonstração</h1>
          <p className="text-muted-foreground">
            Gerencie dados de seed para demonstração e testes do sistema
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleClearData}
            disabled={isClearing || isSeeding}
          >
            {isClearing ? (
              <LoadingSpinner className="mr-2 h-4 w-4" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Limpar Dados
          </Button>
          
          <Button
            onClick={handleSeedDatabase}
            disabled={isSeeding || isClearing}
          >
            {isSeeding ? (
              <LoadingSpinner className="mr-2 h-4 w-4" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Popular Banco
          </Button>
        </div>
      </div>

      {/* Aviso importante */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Atenção</AlertTitle>
        <AlertDescription>
          Esta funcionalidade é destinada apenas para demonstração e testes. 
          Use apenas em ambientes de desenvolvimento. Os dados criados são fictícios.
        </AlertDescription>
      </Alert>

      {/* Progress bar durante seeding */}
      {isSeeding && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Populando banco de dados...</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado */}
      {seedResult && (
        <Alert className={seedResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {seedResult.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertTitle className={seedResult.success ? "text-green-800" : "text-red-800"}>
            {seedResult.success ? 'Sucesso!' : 'Erro!'}
          </AlertTitle>
          <AlertDescription className={seedResult.success ? "text-green-700" : "text-red-700"}>
            {seedResult.message}
            {seedResult.counts && (
              <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                {Object.entries(seedResult.counts).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize">{key}:</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Erro */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Erro!</AlertTitle>
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Informações sobre os dados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {seedDataInfo.map((item, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 ${item.color}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detalhes dos dados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usuários de demonstração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Usuários de Demonstração</span>
            </CardTitle>
            <CardDescription>
              Usuários criados para testar diferentes papéis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">João Silva</div>
                  <div className="text-sm text-muted-foreground">joao.silva@empresa.com</div>
                </div>
                <Badge>Admin</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Maria Santos</div>
                  <div className="text-sm text-muted-foreground">maria.santos@empresa.com</div>
                </div>
                <Badge variant="secondary">Finance</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Carlos Oliveira</div>
                  <div className="text-sm text-muted-foreground">carlos.oliveira@empresa.com</div>
                </div>
                <Badge variant="outline">Approver</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Pedro Almeida</div>
                  <div className="text-sm text-muted-foreground">pedro.almeida@empresa.com</div>
                </div>
                <Badge variant="outline">Requester</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados financeiros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Dados Financeiros</span>
            </CardTitle>
            <CardDescription>
              Orçamentos e solicitações de exemplo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Orçamento TI 2024</span>
                  <span>R$ 500.000</span>
                </div>
                <Progress value={40} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  40% utilizado (R$ 200.000)
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Orçamento Marketing 2024</span>
                  <span>R$ 400.000</span>
                </div>
                <Progress value={62.5} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  62.5% utilizado (R$ 250.000)
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">50</div>
                    <div className="text-muted-foreground">Solicitações</div>
                  </div>
                  <div>
                    <div className="font-medium">R$ 2.5M</div>
                    <div className="text-muted-foreground">Valor Total</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Como Usar</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <div className="font-medium">Popular Banco de Dados</div>
                <div className="text-sm text-muted-foreground">
                  Clique em "Popular Banco" para criar todos os dados de demonstração. 
                  Isso incluirá usuários, fornecedores, centros de custo, categorias, 
                  políticas de aprovação, orçamentos, solicitações e notificações.
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <div className="font-medium">Testar o Sistema</div>
                <div className="text-sm text-muted-foreground">
                  Use os usuários criados para testar diferentes funcionalidades. 
                  Cada papel tem permissões específicas para demonstrar o controle de acesso.
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <div className="font-medium">Limpar Dados</div>
                <div className="text-sm text-muted-foreground">
                  Quando terminar os testes, use "Limpar Dados" para remover 
                  todos os dados de demonstração e começar com dados reais.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

