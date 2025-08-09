import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useCreateRequest, useSubmitRequest } from '../hooks/useRequests';
import { useVendors } from '../hooks/useVendors';
import { useCostCenters } from '../hooks/useCostCenters';
import { useCategories } from '../hooks/useCategories';
import { useAuthStore } from '../stores/auth';
import { formatCurrency } from '../utils';

export const NewRequestPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    vendorId: '',
    costCenterId: '',
    categoryId: '',
    dueDate: '',
    notes: '',
    priority: 'medium',
    paymentMethod: 'transfer',
  });
  
  const [attachments, setAttachments] = useState([]);
  const [isDraft, setIsDraft] = useState(true);

  const { data: vendorsData } = useVendors({ limit: 100, status: 'active' });
  const { data: costCentersData } = useCostCenters({ limit: 100, status: 'active' });
  const { data: categoriesData } = useCategories({ limit: 100, status: 'active' });

  const createRequest = useCreateRequest();
  const submitRequest = useSubmitRequest();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newAttachments = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.description.trim()) {
      errors.push('Descrição é obrigatória');
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.push('Valor deve ser maior que zero');
    }
    
    if (!formData.vendorId) {
      errors.push('Fornecedor é obrigatório');
    }
    
    if (!formData.costCenterId) {
      errors.push('Centro de custo é obrigatório');
    }
    
    if (!formData.categoryId) {
      errors.push('Categoria é obrigatória');
    }
    
    return errors;
  };

  const handleSave = async (submitForApproval = false) => {
    const errors = validateForm();
    
    if (errors.length > 0) {
      alert('Erros no formulário:\n' + errors.join('\n'));
      return;
    }

    try {
      const vendor = vendorsData?.data?.find(v => v.id === formData.vendorId);
      
      const requestData = {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        vendorId: formData.vendorId,
        vendorName: vendor?.name || '',
        costCenterId: formData.costCenterId,
        categoryId: formData.categoryId,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        notes: formData.notes.trim(),
        requesterId: user.id,
        requesterName: user.name,
        priority: formData.priority,
        paymentMethod: formData.paymentMethod,
        attachments: attachments.map(att => att.name), // Simplified for now
      };

      const newRequest = await createRequest.mutateAsync(requestData);
      
      if (submitForApproval) {
        await submitRequest.mutateAsync(newRequest.id);
      }
      
      navigate('/requests');
    } catch (error) {
      console.error('Erro ao salvar solicitação:', error);
    }
  };

  const getSelectedVendor = () => {
    return vendorsData?.data?.find(v => v.id === formData.vendorId);
  };

  const getSelectedCostCenter = () => {
    return costCentersData?.data?.find(cc => cc.id === formData.costCenterId);
  };

  const getSelectedCategory = () => {
    return categoriesData?.data?.find(c => c.id === formData.categoryId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/requests')}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Solicitação de Pagamento</h1>
          <p className="text-muted-foreground">
            Preencha os dados para criar uma nova solicitação
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Dados principais da solicitação de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o motivo do pagamento..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Valor *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                  />
                  {formData.amount && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatCurrency(parseFloat(formData.amount) || 0)}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="dueDate">Data de Vencimento</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleInputChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="paymentMethod">Método de Pagamento</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => handleInputChange('paymentMethod', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer">Transferência</SelectItem>
                      <SelectItem value="check">Cheque</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="card">Cartão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Classificação */}
          <Card>
            <CardHeader>
              <CardTitle>Classificação</CardTitle>
              <CardDescription>
                Selecione o fornecedor, centro de custo e categoria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="vendor">Fornecedor *</Label>
                <Select
                  value={formData.vendorId}
                  onValueChange={(value) => handleInputChange('vendorId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorsData?.data?.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="costCenter">Centro de Custo *</Label>
                <Select
                  value={formData.costCenterId}
                  onValueChange={(value) => handleInputChange('costCenterId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um centro de custo" />
                  </SelectTrigger>
                  <SelectContent>
                    {costCentersData?.data?.map((cc) => (
                      <SelectItem key={cc.id} value={cc.id}>
                        {cc.code} - {cc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => handleInputChange('categoryId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesData?.data?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
              <CardDescription>
                Informações adicionais sobre a solicitação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Observações adicionais..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Anexos */}
          <Card>
            <CardHeader>
              <CardTitle>Anexos</CardTitle>
              <CardDescription>
                Adicione documentos relacionados à solicitação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <div className="mt-4">
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-sm font-medium text-primary hover:text-primary/80">
                      Clique para fazer upload
                    </span>
                    <span className="text-sm text-muted-foreground"> ou arraste arquivos aqui</span>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  PDF, DOC, XLS, JPG, PNG até 10MB cada
                </p>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {attachment.name.split('.').pop()?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{attachment.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(attachment.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Resumo */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Valor Total</Label>
                <p className="text-2xl font-bold">
                  {formatCurrency(parseFloat(formData.amount) || 0)}
                </p>
              </div>

              {getSelectedVendor() && (
                <div>
                  <Label className="text-sm font-medium">Fornecedor</Label>
                  <p className="text-sm">{getSelectedVendor().name}</p>
                </div>
              )}

              {getSelectedCostCenter() && (
                <div>
                  <Label className="text-sm font-medium">Centro de Custo</Label>
                  <p className="text-sm">{getSelectedCostCenter().name}</p>
                </div>
              )}

              {getSelectedCategory() && (
                <div>
                  <Label className="text-sm font-medium">Categoria</Label>
                  <p className="text-sm">
                    {getSelectedCategory().icon} {getSelectedCategory().name}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Anexos</Label>
                <p className="text-sm">{attachments.length} arquivo(s)</p>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button
                onClick={() => handleSave(false)}
                variant="outline"
                className="w-full"
                disabled={createRequest.isPending}
              >
                {createRequest.isPending && <LoadingSpinner size="sm" className="mr-2" />}
                Salvar como Rascunho
              </Button>
              
              <Button
                onClick={() => handleSave(true)}
                className="w-full"
                disabled={createRequest.isPending || submitRequest.isPending}
              >
                {(createRequest.isPending || submitRequest.isPending) && (
                  <LoadingSpinner size="sm" className="mr-2" />
                )}
                Enviar para Aprovação
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
