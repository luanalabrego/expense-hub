import { useState, useCallback } from 'react';
import { 
  Upload, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  FileText, 
  Image, 
  File,
  Calendar,
  User,
  Tag,
  FolderOpen,
  Plus,
  Grid,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
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
  useDocuments,
  useDocumentCategories,
  useDocumentStats,
  useUploadDocument,
  useDeleteDocument,
  useDownloadDocument,
  useValidateFile,
  useSearchDocuments
} from '../hooks/useDocuments';
import { useAuthStore } from '../stores/auth';
import { formatCurrency, formatFileSize, formatDate } from '../utils';

export const DocumentsPage = () => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('uploadedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [page, setPage] = useState(1);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});

  const { user, hasAnyRole } = useAuthStore();

  // Dados principais
  const { data: documentsData, isLoading, error } = useDocuments({
    page,
    limit: 20,
    search: search || undefined,
    category: categoryFilter || undefined,
    fileType: typeFilter || undefined,
    sortBy,
    sortOrder,
  });

  const { data: categories } = useDocumentCategories();
  const { data: stats } = useDocumentStats();
  const { data: searchResults } = useSearchDocuments(search, {}, 10);

  // Mutations
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();
  const { downloadDocument } = useDownloadDocument();
  const { validateFile } = useValidateFile();

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return Image;
    if (fileType?.includes('pdf')) return FileText;
    return File;
  };

  const getFileTypeLabel = (fileType) => {
    const types = {
      'application/pdf': 'PDF',
      'application/msword': 'DOC',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'application/vnd.ms-excel': 'XLS',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
      'image/jpeg': 'JPG',
      'image/png': 'PNG',
      'image/gif': 'GIF',
      'text/plain': 'TXT',
      'text/csv': 'CSV',
    };
    return types[fileType] || 'FILE';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'general': 'bg-gray-100 text-gray-800',
      'invoice': 'bg-green-100 text-green-800',
      'contract': 'bg-blue-100 text-blue-800',
      'receipt': 'bg-yellow-100 text-yellow-800',
      'report': 'bg-purple-100 text-purple-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const handleFileSelect = useCallback((event) => {
    const files = Array.from(event.target.files);
    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      const validation = validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.errors.join(', ')}`);
      }
    });

    if (errors.length > 0) {
      alert(`Alguns arquivos não puderam ser selecionados:\n${errors.join('\n')}`);
    }

    setSelectedFiles(validFiles);
  }, [validateFile]);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    for (const file of selectedFiles) {
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        await uploadDocument.mutateAsync({
          file,
          category: 'general',
          userId: user.id,
          onProgress: (progress) => {
            setUploadProgress(prev => ({ 
              ...prev, 
              [file.name]: progress.percentage 
            }));
          },
        });

        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      } catch (error) {
        console.error('Erro no upload:', error);
        setUploadProgress(prev => ({ ...prev, [file.name]: -1 }));
      }
    }

    // Limpar após upload
    setTimeout(() => {
      setSelectedFiles([]);
      setUploadProgress({});
      setUploadDialogOpen(false);
    }, 2000);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Tem certeza que deseja deletar o documento "${name}"?`)) {
      await deleteDocument.mutateAsync(id);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Erro ao carregar documentos: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
          <p className="text-muted-foreground">
            Gerencie arquivos, contratos, faturas e outros documentos
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload de Documentos</DialogTitle>
                <DialogDescription>
                  Selecione os arquivos que deseja enviar
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Clique para selecionar arquivos
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        PDF, DOC, XLS, IMG até 50MB
                      </span>
                    </label>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.csv"
                    />
                  </div>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Arquivos selecionados:</h4>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <File className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({formatFileSize(file.size)})
                          </span>
                        </div>
                        
                        {uploadProgress[file.name] !== undefined && (
                          <div className="w-20">
                            {uploadProgress[file.name] === -1 ? (
                              <span className="text-xs text-red-600">Erro</span>
                            ) : (
                              <Progress value={uploadProgress[file.name]} className="h-2" />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleUpload}
                    disabled={selectedFiles.length === 0 || uploadDocument.isPending}
                  >
                    {uploadDocument.isPending ? 'Enviando...' : 'Enviar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total de Documentos</p>
                <p className="text-2xl font-bold">{stats?.totalDocuments || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Espaço Utilizado</p>
                <p className="text-2xl font-bold">{formatFileSize(stats?.totalSize || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Download className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Total de Downloads</p>
                <p className="text-2xl font-bold">{stats?.totalDownloads || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Recentes (7 dias)</p>
                <p className="text-2xl font-bold">{stats?.recentDocuments || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e busca */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar documentos específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, descrição ou tags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="application/pdf">PDF</SelectItem>
                <SelectItem value="image/">Imagens</SelectItem>
                <SelectItem value="application/msword">Word</SelectItem>
                <SelectItem value="application/vnd.ms-excel">Excel</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de documentos */}
      <Card>
        <CardHeader>
          <CardTitle>
            Documentos ({documentsData?.total || 0})
          </CardTitle>
          <CardDescription>
            Arquivos e documentos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewMode === 'table' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Nome</span>
                      {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('fileSize')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Tamanho</span>
                      {getSortIcon('fileSize')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('uploadedAt')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Upload</span>
                      {getSortIcon('uploadedAt')}
                    </div>
                  </TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentsData?.data?.map((document) => {
                  const FileIcon = getFileIcon(document.fileType);
                  
                  return (
                    <TableRow key={document.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <FileIcon className="h-5 w-5 text-gray-500" />
                          <div>
                            <div className="font-medium">{document.name}</div>
                            {document.description && (
                              <div className="text-sm text-muted-foreground">
                                {document.description}
                              </div>
                            )}
                            {document.tags && document.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {document.tags.slice(0, 2).map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {document.tags.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{document.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getFileTypeLabel(document.fileType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(document.category)}>
                          {document.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatFileSize(document.fileSize)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(document.uploadedAt)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          por {document.uploadedBy}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Download className="h-3 w-3" />
                          <span>{document.downloadCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => downloadDocument(document)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </DropdownMenuItem>
                            
                            {hasAnyRole(['admin', 'finance']) && (
                              <>
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem
                                  onClick={() => handleDelete(document.id, document.name)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Deletar
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            // Grid view
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {documentsData?.data?.map((document) => {
                const FileIcon = getFileIcon(document.fileType);
                
                return (
                  <Card key={document.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <FileIcon className="h-8 w-8 text-gray-500" />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => downloadDocument(document)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </DropdownMenuItem>
                            {hasAnyRole(['admin', 'finance']) && (
                              <>
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(document.id, document.name)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Deletar
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm line-clamp-2">
                          {document.name}
                        </h4>
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {getFileTypeLabel(document.fileType)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(document.fileSize)}
                          </span>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          {formatDate(document.uploadedAt)}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Badge className={getCategoryColor(document.category)}>
                            {document.category}
                          </Badge>
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Download className="h-3 w-3" />
                            <span>{document.downloadCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {documentsData?.data?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum documento encontrado</p>
              <p className="text-sm">
                Faça upload de arquivos para começar a organizar seus documentos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {documentsData && documentsData.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Anterior
          </Button>
          
          <span className="flex items-center px-4">
            Página {page} de {documentsData.totalPages}
          </span>
          
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === documentsData.totalPages}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
};
