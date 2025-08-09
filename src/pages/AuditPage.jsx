import { useState } from 'react';
import { 
  Shield, 
  Search, 
  Filter,
  Calendar,
  User,
  Activity,
  Eye,
  Download,
  BarChart3,
  Clock,
  Database,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
  Settings,
  Globe,
  Building,
  Tag,
  Receipt,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { Progress } from '../components/ui/progress';
import {
  useAuditLogs,
  useAuditStats,
  useCurrentUserRecentActivity,
  useAuditReport
} from '../hooks/useAudit';
import { useAuthStore } from '../stores/auth';
import { formatDate, formatRelativeTime } from '../utils';

export const AuditPage = () => {
  const [activeTab, setActiveTab] = useState('logs');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const { user, hasAnyRole } = useAuthStore();

  // Calcular filtros de data
  const getDateFilters = () => {
    const now = new Date();
    const filters = {};
    
    switch (dateRange) {
      case '1d':
        filters.dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        filters.dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        filters.dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        filters.dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
    }
    
    return filters;
  };

  // Hooks
  const { data: auditLogs, isLoading } = useAuditLogs({
    page,
    limit: 50,
    ...(searchTerm && { search: searchTerm }),
    ...(actionFilter !== 'all' && { action: actionFilter }),
    ...(entityFilter !== 'all' && { entity: entityFilter }),
    ...(userFilter !== 'all' && { actorId: userFilter }),
    ...getDateFilters(),
  });

  const { data: auditStats } = useAuditStats(getDateFilters());
  const { data: userActivity } = useCurrentUserRecentActivity(10);
  const { data: auditReport } = useAuditReport({
    ...getDateFilters(),
    groupBy: 'action',
    period: 'day',
  });

  const getActionIcon = (action) => {
    switch (action) {
      case 'login':
      case 'logout':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'create':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'update':
        return <Edit className="h-4 w-4 text-yellow-600" />;
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'approve':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'reject':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'upload':
      case 'download':
        return <FileText className="h-4 w-4 text-purple-600" />;
      case 'import':
      case 'export':
        return <Database className="h-4 w-4 text-indigo-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEntityIcon = (entity) => {
    switch (entity) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'vendor':
        return <Building className="h-4 w-4" />;
      case 'cost_center':
        return <Database className="h-4 w-4" />;
      case 'category':
        return <Tag className="h-4 w-4" />;
      case 'request':
        return <Receipt className="h-4 w-4" />;
      case 'budget':
        return <DollarSign className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getActionLabel = (action) => {
    const labels = {
      login: 'Login',
      logout: 'Logout',
      login_failed: 'Login Falhado',
      create: 'Criação',
      read: 'Visualização',
      update: 'Atualização',
      delete: 'Exclusão',
      approve: 'Aprovação',
      reject: 'Rejeição',
      upload: 'Upload',
      download: 'Download',
      import: 'Importação',
      export: 'Exportação',
      budget_commit: 'Compromisso Orçamentário',
      budget_spend: 'Gasto Orçamentário',
      budget_release: 'Liberação Orçamentária',
    };
    return labels[action] || action;
  };

  const getEntityLabel = (entity) => {
    const labels = {
      user: 'Usuário',
      vendor: 'Fornecedor',
      cost_center: 'Centro de Custo',
      category: 'Categoria',
      request: 'Solicitação',
      approval_policy: 'Política de Aprovação',
      budget: 'Orçamento',
      document: 'Documento',
      notification: 'Notificação',
      system: 'Sistema',
    };
    return labels[entity] || entity;
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setDetailsDialogOpen(true);
  };

  const handleExportReport = () => {
    // Implementar exportação de relatório
    console.log('Exportar relatório de auditoria');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auditoria</h1>
          <p className="text-muted-foreground">
            Logs de auditoria e rastreabilidade do sistema
          </p>
        </div>
        
        {hasAnyRole(['admin', 'finance']) && (
          <Button onClick={handleExportReport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total de Ações</p>
                <p className="text-2xl font-bold">
                  {auditStats?.total || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Recentes</p>
                <p className="text-2xl font-bold">
                  {auditStats?.recent || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Usuários Ativos</p>
                <p className="text-2xl font-bold">
                  {Object.keys(auditStats?.byUser || {}).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Entidades</p>
                <p className="text-2xl font-bold">
                  {Object.keys(auditStats?.byEntity || {}).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logs">Logs de Auditoria</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          <TabsTrigger value="activity">Minha Atividade</TabsTrigger>
        </TabsList>

        {/* Tab de Logs */}
        <TabsContent value="logs" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as ações</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                    <SelectItem value="create">Criação</SelectItem>
                    <SelectItem value="update">Atualização</SelectItem>
                    <SelectItem value="delete">Exclusão</SelectItem>
                    <SelectItem value="approve">Aprovação</SelectItem>
                    <SelectItem value="reject">Rejeição</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por entidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as entidades</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="vendor">Fornecedor</SelectItem>
                    <SelectItem value="cost_center">Centro de Custo</SelectItem>
                    <SelectItem value="category">Categoria</SelectItem>
                    <SelectItem value="request">Solicitação</SelectItem>
                    <SelectItem value="budget">Orçamento</SelectItem>
                    <SelectItem value="document">Documento</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1d">Último dia</SelectItem>
                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                    <SelectItem value="30d">Últimos 30 dias</SelectItem>
                    <SelectItem value="90d">Últimos 90 dias</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setActionFilter('all');
                  setEntityFilter('all');
                  setUserFilter('all');
                  setDateRange('7d');
                  setPage(1);
                }}>
                  <Filter className="mr-2 h-4 w-4" />
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de logs */}
          <Card>
            <CardHeader>
              <CardTitle>Logs de Auditoria</CardTitle>
              <CardDescription>
                Histórico completo de ações no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogs?.data?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Entidade</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.data.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {formatDate(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{log.actorName}</div>
                              <div className="text-sm text-muted-foreground">
                                {log.actorEmail}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getActionIcon(log.action)}
                            <Badge variant="outline">
                              {getActionLabel(log.action)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getEntityIcon(log.entity)}
                            <div>
                              <div className="font-medium">
                                {getEntityLabel(log.entity)}
                              </div>
                              {log.entityName && (
                                <div className="text-sm text-muted-foreground">
                                  {log.entityName}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.changes && Object.keys(log.changes).length > 0 && (
                            <Badge variant="secondary">
                              {Object.keys(log.changes).length} campo(s) alterado(s)
                            </Badge>
                          )}
                          {log.metadata && (
                            <div className="text-sm text-muted-foreground">
                              {JSON.stringify(log.metadata).substring(0, 50)}...
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <div className="flex items-center space-x-1">
                            <Globe className="h-3 w-3 text-muted-foreground" />
                            <span>{log.ipAddress || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhum log encontrado</p>
                  <p className="text-sm">
                    Tente ajustar os filtros ou aguarde novas atividades.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Paginação */}
          {auditLogs?.totalPages > 1 && (
            <div className="flex justify-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Página {page} de {auditLogs.totalPages}
              </span>
              
              <Button
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= auditLogs.totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Tab de Estatísticas */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top ações */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Mais Comuns</CardTitle>
                <CardDescription>
                  Ações mais realizadas no período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditStats?.topActions?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getActionIcon(item.action)}
                        <span className="font-medium">
                          {getActionLabel(item.action)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${(item.count / auditStats.topActions[0].count) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top usuários */}
            <Card>
              <CardHeader>
                <CardTitle>Usuários Mais Ativos</CardTitle>
                <CardDescription>
                  Usuários com mais atividade no período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditStats?.topUsers?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{item.user}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ 
                              width: `${(item.count / auditStats.topUsers[0].count) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Distribuição por entidade */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Entidade</CardTitle>
                <CardDescription>
                  Atividade por tipo de entidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(auditStats?.byEntity || {}).map(([entity, count]) => (
                    <div key={entity} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getEntityIcon(entity)}
                        <span className="font-medium">
                          {getEntityLabel(entity)}
                        </span>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resumo de compliance */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance</CardTitle>
                <CardDescription>
                  Métricas de auditoria e compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Cobertura de Auditoria</span>
                      <span>100%</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Usuários Monitorados</span>
                      <span>{Object.keys(auditStats?.byUser || {}).length}</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Entidades Rastreadas</span>
                      <span>{Object.keys(auditStats?.byEntity || {}).length}</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab de Atividade do Usuário */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Minha Atividade Recente</CardTitle>
              <CardDescription>
                Suas últimas ações no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userActivity?.length > 0 ? (
                <div className="space-y-4">
                  {userActivity.map((log) => (
                    <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">
                            {getActionLabel(log.action)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {getEntityLabel(log.entity)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {log.entityName || log.entityId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(log.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhuma atividade recente</p>
                  <p className="text-sm">
                    Suas ações no sistema aparecerão aqui.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de detalhes */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Log de Auditoria</DialogTitle>
            <DialogDescription>
              Informações completas sobre a ação realizada
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-6">
              {/* Informações básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Data/Hora</label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedLog.timestamp)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Usuário</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedLog.actorName} ({selectedLog.actorEmail})
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Ação</label>
                  <p className="text-sm text-muted-foreground">
                    {getActionLabel(selectedLog.action)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Entidade</label>
                  <p className="text-sm text-muted-foreground">
                    {getEntityLabel(selectedLog.entity)} - {selectedLog.entityName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">IP Address</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedLog.ipAddress || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">User Agent</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedLog.userAgent || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Mudanças */}
              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Mudanças</label>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campo</TableHead>
                          <TableHead>Valor Anterior</TableHead>
                          <TableHead>Novo Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(selectedLog.changes).map(([field, change]) => (
                          <TableRow key={field}>
                            <TableCell className="font-medium">{field}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {JSON.stringify(change.from)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {JSON.stringify(change.to)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Metadados */}
              {selectedLog.metadata && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Metadados</label>
                  <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Dados antes/depois */}
              {(selectedLog.before || selectedLog.after) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {selectedLog.before && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Antes</label>
                      <pre className="text-xs bg-red-50 p-4 rounded-lg overflow-auto max-h-40">
                        {JSON.stringify(selectedLog.before, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.after && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Depois</label>
                      <pre className="text-xs bg-green-50 p-4 rounded-lg overflow-auto max-h-40">
                        {JSON.stringify(selectedLog.after, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
