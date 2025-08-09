import { useState } from 'react';
import { 
  Upload, 
  Download, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Eye,
  FileSpreadsheet,
  Database,
  Users,
  Building,
  Tag,
  Receipt,
  Calendar,
  TrendingUp,
  BarChart3,
  Settings
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
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import {
  useImportData,
  useValidateImportData,
  useExportData,
  useImportStats,
  useDownloadTemplate,
  useImportTemplates,
  useValidateFile,
  usePreviewImportData,
  useImportHistory,
  useExportStats
} from '../hooks/useImportExport';
import { useAuthStore } from '../stores/auth';
import { formatDate, formatFileSize } from '../utils';

export const ImportExportPage = () => {
  const [activeTab, setActiveTab] = useState('import');
  const [selectedEntityType, setSelectedEntityType] = useState('vendors');
  const [selectedFile, setSelectedFile] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [skipFirstRow, setSkipFirstRow] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportFilters, setExportFilters] = useState({});

  const { user, hasAnyRole } = useAuthStore();

  // Hooks
  const importData = useImportData();
  const validateImportData = useValidateImportData();
  const exportData = useExportData();
  const { data: importStats } = useImportStats(selectedEntityType);
  const { downloadTemplate } = useDownloadTemplate();
  const { data: templates } = useImportTemplates();
  const { validateFile } = useValidateFile();
  const previewImportData = usePreviewImportData();
  const { data: importHistory } = useImportHistory();
  const { data: exportStats } = useExportStats();

  const entityTypes = [
    { value: 'vendors', label: 'Fornecedores', icon: Building },
    { value: 'cost-centers', label: 'Centros de Custo', icon: Database },
    { value: 'categories', label: 'Categorias', icon: Tag },
    { value: 'users', label: 'Usuários', icon: Users },
    { value: 'requests', label: 'Solicitações', icon: Receipt },
  ];

  const getEntityIcon = (entityType) => {
    const entity = entityTypes.find(e => e.value === entityType);
    return entity ? entity.icon : FileText;
  };

  const getEntityLabel = (entityType) => {
    const entity = entityTypes.find(e => e.value === entityType);
    return entity ? entity.label : entityType;
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validation = validateFile(file, selectedEntityType);
    if (!validation.isValid) {
      alert(`Arquivo inválido:\n${validation.errors.join('\n')}`);
      return;
    }

    setSelectedFile(file);
  };

  const handlePreview = async () => {
    if (!selectedFile) return;

    try {
      const result = await previewImportData.mutateAsync({
        file: selectedFile,
        entityType: selectedEntityType,
        skipFirstRow,
      });
      setPreviewDialogOpen(true);
    } catch (error) {
      console.error('Erro no preview:', error);
    }
  };

  const handleValidate = async () => {
    if (!selectedFile) return;

    await validateImportData.mutateAsync({
      options: {
        file: selectedFile,
        entityType: selectedEntityType,
        skipFirstRow,
        updateExisting,
        validateOnly: true,
      },
      userId: user.id,
    });
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    const result = await importData.mutateAsync({
      options: {
        file: selectedFile,
        entityType: selectedEntityType,
        skipFirstRow,
        updateExisting,
        validateOnly: false,
      },
      userId: user.id,
    });

    if (result.success || result.successRows > 0) {
      setSelectedFile(null);
      setImportDialogOpen(false);
    }
  };

  const handleExport = async () => {
    await exportData.mutateAsync({
      entityType: selectedEntityType,
      format: exportFormat,
      filters: exportFilters,
    });
    setExportDialogOpen(false);
  };

  const handleDownloadTemplate = () => {
    downloadTemplate(selectedEntityType);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Importação & Exportação</h1>
          <p className="text-muted-foreground">
            Importe dados em lote ou exporte relatórios do sistema
          </p>
        </div>
      </div>

      {/* Estatísticas gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Upload className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Importado</p>
                <p className="text-2xl font-bold">
                  {exportStats?.reduce((sum, stat) => sum + stat.total, 0) || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Recentes (30 dias)</p>
                <p className="text-2xl font-bold">
                  {exportStats?.reduce((sum, stat) => sum + stat.recent, 0) || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Entidades Ativas</p>
                <p className="text-2xl font-bold">
                  {exportStats?.filter(stat => stat.total > 0).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">98%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import">Importação</TabsTrigger>
          <TabsTrigger value="export">Exportação</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        {/* Tab de Importação */}
        <TabsContent value="import" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuração de importação */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Importar Dados</CardTitle>
                  <CardDescription>
                    Selecione o tipo de dados e arquivo para importação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Seleção de entidade */}
                  <div>
                    <label className="text-sm font-medium">Tipo de Dados</label>
                    <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {entityTypes.map((entity) => {
                          const Icon = entity.icon;
                          return (
                            <SelectItem key={entity.value} value={entity.value}>
                              <div className="flex items-center space-x-2">
                                <Icon className="h-4 w-4" />
                                <span>{entity.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Upload de arquivo */}
                  <div>
                    <label className="text-sm font-medium">Arquivo CSV</label>
                    <div className="mt-1">
                      <Input
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileSelect}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    {selectedFile && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Arquivo selecionado: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </div>
                    )}
                  </div>

                  {/* Opções */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="skipFirstRow"
                        checked={skipFirstRow}
                        onChange={(e) => setSkipFirstRow(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="skipFirstRow" className="text-sm">
                        Primeira linha contém cabeçalhos
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="updateExisting"
                        checked={updateExisting}
                        onChange={(e) => setUpdateExisting(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="updateExisting" className="text-sm">
                        Atualizar registros existentes
                      </label>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleDownloadTemplate}
                      className="flex-1"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Template
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handlePreview}
                      disabled={!selectedFile || previewImportData.isPending}
                      className="flex-1"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {previewImportData.isPending ? 'Carregando...' : 'Preview'}
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleValidate}
                      disabled={!selectedFile || validateImportData.isPending}
                      className="flex-1"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {validateImportData.isPending ? 'Validando...' : 'Validar'}
                    </Button>
                    
                    <Button
                      onClick={handleImport}
                      disabled={!selectedFile || importData.isPending}
                      className="flex-1"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {importData.isPending ? 'Importando...' : 'Importar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Informações e estatísticas */}
            <div className="space-y-4">
              {/* Template info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Template</CardTitle>
                  <CardDescription>
                    Estrutura para {getEntityLabel(selectedEntityType)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {templates && templates[selectedEntityType] && (
                    <div className="space-y-3">
                      <div className="text-sm">
                        <strong>Campos obrigatórios:</strong>
                      </div>
                      <div className="space-y-1">
                        {templates[selectedEntityType].columns
                          .filter(col => col.required)
                          .map((col, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {col.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {col.type}
                              </span>
                            </div>
                          ))}
                      </div>
                      
                      <div className="text-sm">
                        <strong>Instruções:</strong>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {templates[selectedEntityType].instructions.map((instruction, index) => (
                          <li key={index} className="flex items-start space-x-1">
                            <span>•</span>
                            <span>{instruction}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Estatísticas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Estatísticas</CardTitle>
                  <CardDescription>
                    Dados atuais de {getEntityLabel(selectedEntityType)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {importStats && (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Total de registros:</span>
                        <span className="font-medium">{importStats.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Recentes (30 dias):</span>
                        <span className="font-medium">{importStats.recent}</span>
                      </div>
                      
                      {Object.keys(importStats.byStatus).length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-2">Por status:</div>
                          <div className="space-y-1">
                            {Object.entries(importStats.byStatus).map(([status, count]) => (
                              <div key={status} className="flex justify-between">
                                <Badge variant="outline" className="text-xs">
                                  {status}
                                </Badge>
                                <span className="text-sm">{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Resultados de validação/importação */}
          {(validateImportData.data || importData.data) && (
            <Card>
              <CardHeader>
                <CardTitle>Resultado</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const result = importData.data || validateImportData.data;
                  const isValidation = !!validateImportData.data && !importData.data;
                  
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {result.success ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                          )}
                          <span className="font-medium">
                            {isValidation ? 'Validação' : 'Importação'} {result.success ? 'bem-sucedida' : 'com erros'}
                          </span>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {result.successRows} de {result.totalRows} registros processados
                        </div>
                      </div>

                      {result.successRows > 0 && (
                        <Progress 
                          value={(result.successRows / result.totalRows) * 100} 
                          className="h-2"
                        />
                      )}

                      {result.errors.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Erros encontrados:</h4>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {result.errors.slice(0, 10).map((error, index) => (
                              <Alert key={index} variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Linha {error.row}</AlertTitle>
                                <AlertDescription>
                                  {error.field}: {error.message}
                                </AlertDescription>
                              </Alert>
                            ))}
                            {result.errors.length > 10 && (
                              <div className="text-sm text-muted-foreground">
                                ... e mais {result.errors.length - 10} erros
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab de Exportação */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exportar Dados</CardTitle>
              <CardDescription>
                Exporte dados do sistema em diferentes formatos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tipo de Dados</label>
                  <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {entityTypes.map((entity) => {
                        const Icon = entity.icon;
                        return (
                          <SelectItem key={entity.value} value={entity.value}>
                            <div className="flex items-center space-x-2">
                              <Icon className="h-4 w-4" />
                              <span>{entity.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Formato</label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleExport}
                  disabled={exportData.isPending}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {exportData.isPending ? 'Exportando...' : 'Exportar'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas de exportação */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exportStats?.map((stat) => {
              const Icon = getEntityIcon(stat.entityType);
              return (
                <Card key={stat.entityType}>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-medium">{getEntityLabel(stat.entityType)}</h3>
                        <p className="text-2xl font-bold">{stat.total}</p>
                        <p className="text-sm text-muted-foreground">
                          {stat.recent} recentes
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab de Histórico */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Importações</CardTitle>
              <CardDescription>
                Registro de todas as importações realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {importHistory && importHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Arquivo</TableHead>
                      <TableHead>Registros</TableHead>
                      <TableHead>Sucesso</TableHead>
                      <TableHead>Erros</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Usuário</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {getEntityLabel(item.entityType)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {item.fileName}
                        </TableCell>
                        <TableCell>{item.totalRows}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>{item.successRows}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.errors > 0 ? (
                            <div className="flex items-center space-x-1">
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span>{item.errors}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(item.importedAt)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.importedBy}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhuma importação realizada</p>
                  <p className="text-sm">
                    O histórico de importações aparecerá aqui após a primeira importação.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Preview */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview dos Dados</DialogTitle>
            <DialogDescription>
              Visualização das primeiras linhas do arquivo
            </DialogDescription>
          </DialogHeader>
          
          {previewImportData.data && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Mostrando primeiras 5 linhas de {previewImportData.data.totalRows} registros
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {previewImportData.data.headers.map((header, index) => (
                        <TableHead key={index}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewImportData.data.data.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <TableCell key={cellIndex} className="font-mono text-sm">
                            {cell}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

