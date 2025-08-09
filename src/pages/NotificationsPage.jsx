import { useState } from 'react';
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  Trash2, 
  Filter,
  Search,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  Eye,
  EyeOff,
  Settings,
  MoreHorizontal
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import {
  useUserNotifications,
  useUserUnreadNotifications,
  useUserUnreadCount,
  useMarkNotificationAsRead,
  useMarkMultipleNotificationsAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useNotificationStats,
  useUserRealtimeNotifications
} from '../hooks/useNotifications';
import { useAuthStore } from '../stores/auth';
import { formatDate, formatRelativeTime } from '../utils';

export const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { user } = useAuthStore();

  // Hooks
  const { data: allNotifications, isLoading } = useUserNotifications({
    page,
    limit: 20,
    ...(searchTerm && { search: searchTerm }),
    ...(typeFilter !== 'all' && { type: typeFilter }),
    ...(priorityFilter !== 'all' && { priority: priorityFilter }),
  });

  const { data: unreadNotifications } = useUserUnreadNotifications();
  const { data: unreadCount } = useUserUnreadCount();
  const { data: notificationStats } = useNotificationStats(user?.id);
  const { notifications: realtimeNotifications } = useUserRealtimeNotifications({
    limit: 10,
    unreadOnly: true,
  });

  const markAsRead = useMarkNotificationAsRead();
  const markMultipleAsRead = useMarkMultipleNotificationsAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'approval_request':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'approval_response':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'budget_alert':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'system':
        return <Settings className="h-4 w-4 text-gray-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      approval_request: 'Solicitação de Aprovação',
      approval_response: 'Resposta de Aprovação',
      budget_alert: 'Alerta Orçamentário',
      warning: 'Aviso',
      error: 'Erro',
      success: 'Sucesso',
      info: 'Informação',
      system: 'Sistema',
    };
    return labels[type] || type;
  };

  const handleMarkAsRead = async (notificationId) => {
    await markAsRead.mutateAsync(notificationId);
  };

  const handleMarkSelectedAsRead = async () => {
    if (selectedNotifications.length > 0) {
      await markMultipleAsRead.mutateAsync(selectedNotifications);
      setSelectedNotifications([]);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (user?.id) {
      await markAllAsRead.mutateAsync(user.id);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    await deleteNotification.mutateAsync(notificationId);
  };

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    const currentNotifications = getCurrentNotifications();
    const allIds = currentNotifications?.data?.map(n => n.id) || [];
    setSelectedNotifications(
      selectedNotifications.length === allIds.length ? [] : allIds
    );
  };

  const getCurrentNotifications = () => {
    switch (activeTab) {
      case 'unread':
        return unreadNotifications;
      case 'all':
      default:
        return allNotifications;
    }
  };

  const filteredNotifications = getCurrentNotifications()?.data?.filter(notification => {
    const matchesSearch = !searchTerm || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || notification.priority === priorityFilter;
    
    return matchesSearch && matchesType && matchesPriority;
  }) || [];

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
          <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
          <p className="text-muted-foreground">
            Gerencie suas notificações e alertas do sistema
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={!unreadCount || markAllAsRead.isPending}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Marcar todas como lidas
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">
                  {notificationStats?.total || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <BellRing className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Não Lidas</p>
                <p className="text-2xl font-bold">
                  {unreadCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Lidas</p>
                <p className="text-2xl font-bold">
                  {notificationStats?.read || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Recentes</p>
                <p className="text-2xl font-bold">
                  {notificationStats?.recent || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notificações em tempo real */}
      {realtimeNotifications.length > 0 && (
        <Alert>
          <BellRing className="h-4 w-4" />
          <AlertTitle>Novas notificações</AlertTitle>
          <AlertDescription>
            Você tem {realtimeNotifications.length} nova(s) notificação(ões) não lida(s).
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros e busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar notificações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="approval_request">Solicitação de Aprovação</SelectItem>
                <SelectItem value="approval_response">Resposta de Aprovação</SelectItem>
                <SelectItem value="budget_alert">Alerta Orçamentário</SelectItem>
                <SelectItem value="warning">Aviso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="info">Informação</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de notificações */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">
            Todas ({notificationStats?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Não Lidas ({unreadCount || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Ações em lote */}
          {selectedNotifications.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedNotifications.length} notificação(ões) selecionada(s)
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkSelectedAsRead}
                      disabled={markMultipleAsRead.isPending}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Marcar como lidas
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedNotifications([])}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de notificações */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {activeTab === 'all' ? 'Todas as Notificações' : 'Notificações Não Lidas'}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedNotifications.length === filteredNotifications.length 
                    ? 'Desmarcar todas' 
                    : 'Selecionar todas'
                  }
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredNotifications.length > 0 ? (
                <div className="space-y-4">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        notification.read 
                          ? 'bg-gray-50 border-gray-200' 
                          : 'bg-white border-blue-200 shadow-sm'
                      } ${
                        selectedNotifications.includes(notification.id)
                          ? 'ring-2 ring-blue-500'
                          : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification.id)}
                          onChange={() => handleSelectNotification(notification.id)}
                          className="mt-1 rounded"
                        />
                        
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className={`text-sm font-medium ${
                                  notification.read ? 'text-gray-700' : 'text-gray-900'
                                }`}>
                                  {notification.title}
                                </h4>
                                
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getPriorityColor(notification.priority)}`}
                                >
                                  {notification.priority}
                                </Badge>
                                
                                <Badge variant="outline" className="text-xs">
                                  {getTypeLabel(notification.type)}
                                </Badge>
                                
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                )}
                              </div>
                              
                              <p className={`text-sm ${
                                notification.read ? 'text-gray-600' : 'text-gray-700'
                              }`}>
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatRelativeTime(notification.createdAt)}</span>
                                </span>
                                
                                {notification.senderId && (
                                  <span className="flex items-center space-x-1">
                                    <User className="h-3 w-3" />
                                    <span>Sistema</span>
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!notification.read && (
                                  <DropdownMenuItem
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    disabled={markAsRead.isPending}
                                  >
                                    <Check className="mr-2 h-4 w-4" />
                                    Marcar como lida
                                  </DropdownMenuItem>
                                )}
                                
                                {notification.actionUrl && (
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver detalhes
                                  </DropdownMenuItem>
                                )}
                                
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem
                                  onClick={() => handleDeleteNotification(notification.id)}
                                  disabled={deleteNotification.isPending}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remover
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">
                    {activeTab === 'unread' 
                      ? 'Nenhuma notificação não lida' 
                      : 'Nenhuma notificação encontrada'
                    }
                  </p>
                  <p className="text-sm">
                    {activeTab === 'unread'
                      ? 'Todas as suas notificações foram lidas.'
                      : 'Tente ajustar os filtros ou aguarde novas notificações.'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Paginação */}
          {getCurrentNotifications()?.totalPages > 1 && (
            <div className="flex justify-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Página {page} de {getCurrentNotifications()?.totalPages}
              </span>
              
              <Button
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= getCurrentNotifications()?.totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

