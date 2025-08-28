import React, { useState, useRef } from 'react';
import { Plus, Search, MoreHorizontal, Edit, UserX, UserCheck, Shield, ShieldOff, Star, Send, Upload } from 'lucide-react';
import { useVendors, useDeactivateVendor, useReactivateVendor, useBlockVendor, useUnblockVendor, useCreateVendor, useSendVendorToContractReview } from '@/hooks/useVendors';
import { checkVendorCompliance } from '@/services/vendorCompliance';
import { checkTaxIdExists } from '@/services/vendors';
import * as XLSX from 'xlsx';
import { formatCNPJ, formatPhone, formatDate } from '@/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirm } from '@/hooks/useConfirm';

export const VendorsPage = () => {
  const { hasAnyRole, user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: vendorsData, isLoading, isError } = useVendors({ page, limit, search, status: statusFilter });
  const deactivateVendor = useDeactivateVendor();
  const reactivateVendor = useReactivateVendor();
  const blockVendor = useBlockVendor();
  const unblockVendor = useUnblockVendor();
  const sendToLegal = useSendVendorToContractReview();
  const [isNewVendorOpen, setIsNewVendorOpen] = useState(false);
  const createVendor = useCreateVendor();
  const fileInputRef = useRef(null);

  const { confirm, ConfirmationDialog } = useConfirm();

  const handleDeactivate = async (id) => {
    if (await confirm('Tem certeza que deseja desativar este fornecedor?')) {
      await deactivateVendor.mutateAsync(id);
    }
  };

  const handleReactivate = async (id) => {
    if (await confirm('Tem certeza que deseja reativar este fornecedor?')) {
      await reactivateVendor.mutateAsync(id);
    }
  };

  const handleBlock = async (id) => {
    if (await confirm('Tem certeza que deseja bloquear este fornecedor?')) {
      await blockVendor.mutateAsync(id);
    }
  };

  const handleUnblock = async (id) => {
    if (await confirm('Tem certeza que deseja desbloquear este fornecedor?')) {
      await unblockVendor.mutateAsync(id);
    }
  };

  const handleSendToLegal = async (id) => {
    if (await confirm('Enviar contrato para revisão jurídica?')) {
      await sendToLegal.mutateAsync({ id, requesterId: user.id });
    }
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
      for (const row of rows) {
        const name = row['Nome']?.toString().trim();
        const taxId = row['CNPJ']?.toString().replace(/\D/g, '');
        if (!name || !taxId) continue;
        const exists = await checkTaxIdExists(taxId);
        if (exists) continue;
        await createVendor.mutateAsync({
          name,
          taxId,
          email: row['Email']?.toString() || '',
          phone: row['Telefone']?.toString() || '',
          tags: typeof row['Tags'] === 'string' ? row['Tags'].split(',').map(t => t.trim()).filter(Boolean) : [],
          categories: typeof row['Categorias'] === 'string' ? row['Categorias'].split(',').map(t => t.trim()).filter(Boolean) : [],
          paymentTerms: row['PrazoPagamento']?.toString() || '',
          serviceType: row['TipoServico']?.toString() || '',
          scope: row['Escopo']?.toString() || '',
          observations: row['Observacoes']?.toString() || '',
        });
      }
    } catch (err) {
      console.error('Erro ao importar fornecedores:', err);
    } finally {
      e.target.value = '';
    }
  };

  const vendors = vendorsData?.data ?? [];

  return (
    <>
      <NewVendorDialog open={isNewVendorOpen} onOpenChange={setIsNewVendorOpen} />
      <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Fornecedores</h1>
        {hasAnyRole(['admin', 'finance']) && (
          <div className="flex gap-2">
            <input
              type="file"
              accept=".xlsx,.xls"
              ref={fileInputRef}
              onChange={handleBulkUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload em Massa
            </button>
            <button
              onClick={() => setIsNewVendorOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Fornecedor
            </button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nome, CNPJ, e-mail ou tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="pending">Pendente</option>
              <option value="needsInfo">Aguardando Info</option>
              <option value="rejected">Rejeitado</option>
              <option value="contract_review">Revisão Jurídica</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : isError ? (
          <div className="text-center py-12 text-red-500">Erro ao carregar fornecedores</div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum fornecedor encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNPJ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-mail</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vendor.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {vendor.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCNPJ(vendor.taxId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vendor.email || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vendor.phone ? formatPhone(vendor.phone) : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              vendor.rating && i <= vendor.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {vendor.tags?.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vendor.blocked ? (
                        <Badge variant="destructive">Bloqueado</Badge>
                      ) : vendor.status === 'inactive' ? (
                        <Badge variant="secondary">Inativo</Badge>
                      ) : vendor.status === 'pending' ? (
                        <Badge variant="secondary">Pendente</Badge>
                      ) : vendor.status === 'needsInfo' ? (
                        <Badge variant="secondary">Aguardando Info</Badge>
                      ) : vendor.status === 'contract_review' ? (
                        <Badge variant="secondary">Revisão Jurídica</Badge>
                      ) : vendor.status === 'rejected' ? (
                        <Badge variant="destructive">Rejeitado</Badge>
                      ) : (
                        <Badge>Ativo</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(vendor.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {hasAnyRole(['admin', 'finance']) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 rounded-full hover:bg-gray-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {}}>
                              <Edit className="h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            {vendor.status === 'active' && (
                              <DropdownMenuItem onClick={() => handleDeactivate(vendor.id)}>
                                <UserX className="h-4 w-4" /> Desativar
                              </DropdownMenuItem>
                            )}
                            {vendor.status === 'inactive' && (
                              <DropdownMenuItem onClick={() => handleReactivate(vendor.id)}>
                                <UserCheck className="h-4 w-4" /> Reativar
                              </DropdownMenuItem>
                            )}
                            {vendor.status === 'pending' && (
                              <DropdownMenuItem onClick={() => handleSendToLegal(vendor.id)}>
                                <Send className="h-4 w-4" /> Enviar ao Jurídico
                              </DropdownMenuItem>
                            )}
                            {vendor.blocked ? (
                              <DropdownMenuItem onClick={() => handleUnblock(vendor.id)}>
                                <ShieldOff className="h-4 w-4" /> Desbloquear
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleBlock(vendor.id)}>
                                <Shield className="h-4 w-4" /> Bloquear
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginação */}
      {!isLoading && !isError && vendors.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Página {page} de {vendorsData?.totalPages || 1}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-700 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(vendorsData?.totalPages || 1, p + 1))}
              disabled={page === vendorsData?.totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-700 disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
      </div>
      <ConfirmationDialog />
    </>
  );
};

const NewVendorDialog = ({ open, onOpenChange }) => {
  const createVendor = useCreateVendor();
  const form = useForm({
    defaultValues: {
      name: '',
      taxId: '',
      email: '',
      phone: '',
      rating: 0,
      paymentTerms: '',
      serviceType: '',
      scope: '',
      hasContract: false,
      observations: '',
    },
  });
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [contractFile, setContractFile] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [checkingCompliance, setCheckingCompliance] = useState(false);

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const onSubmit = async (values) => {
    let contractUrl = '';
    if (values.hasContract && contractFile) {
      contractUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result?.toString() || '');
        reader.onerror = reject;
        reader.readAsDataURL(contractFile);
      });
    }
    const taxIdClean = values.taxId.replace(/\D/g, '');
    setCheckingCompliance(true);
    const result = await checkVendorCompliance(taxIdClean);
    setCompliance(result);
    setCheckingCompliance(false);
    if (!result.sefazActive || result.serasaBlocked) {
      alert('Fornecedor não passou nas verificações de compliance.');
      return;
    }

    await createVendor.mutateAsync({
      name: values.name,
      taxId: taxIdClean,
      email: values.email || '',
      phone: values.phone ? values.phone.replace(/\D/g, '') : '',
      rating: values.rating,
      tags,
      paymentTerms: values.paymentTerms,
      serviceType: values.serviceType,
      scope: values.scope,
      hasContract: values.hasContract,
      contractUrl,
      observations: values.observations,
      status: 'pending',
      blocked: false,
      compliance: { ...result, checkedAt: new Date() },
    });
    form.reset();
    setTags([]);
    setTagInput('');
    setContractFile(null);
    setCompliance(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Fornecedor</DialogTitle>
          <DialogDescription>Preencha os dados do fornecedor</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              rules={{ required: 'Nome é obrigatório' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-tooltip="Nome do fornecedor">Nome</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="taxId"
              rules={{ required: 'CNPJ é obrigatório' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-tooltip="CNPJ com 14 dígitos">CNPJ</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-tooltip="E-mail de contato">E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-tooltip="Telefone com DDD">Telefone</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => field.onChange(formatPhone(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-tooltip="Avaliação de 1 a 5 estrelas">Rating</FormLabel>
                  <FormControl>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button
                          type="button"
                          key={i}
                          onClick={() => field.onChange(i)}
                        >
                          <Star
                            className={`w-5 h-5 ${
                              i <= field.value
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <div>
              <FormLabel data-tooltip="Palavras-chave para categorizar">Tags</FormLabel>
              <div className="flex flex-wrap gap-1 mb-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                      type="button"
                      className="ml-1 text-xs"
                      onClick={() => removeTag(tag)}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Digite uma tag e pressione Enter"
              />
              <button
                type="button"
                className="px-3 py-2 border rounded-md text-sm"
                onClick={addTag}
              >
                Adicionar
              </button>
            </div>
          </div>
          <FormField
            control={form.control}
            name="paymentTerms"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-tooltip="Condição de pagamento (ex.: 30 dias)">Prazo de Pagamento</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="serviceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-tooltip="Serviço principal prestado">Tipo de Serviço</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="scope"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-tooltip="Descrição do escopo acordado">Escopo</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hasContract"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="mb-0" data-tooltip="Marque se existe contrato vigente">Possui contrato?</FormLabel>
              </FormItem>
            )}
          />
          {form.watch('hasContract') && (
            <div>
              <FormLabel data-tooltip="Anexe o arquivo do contrato">Arquivo do Contrato</FormLabel>
              <Input
                type="file"
                onChange={(e) => setContractFile(e.target.files?.[0] || null)}
              />
            </div>
          )}
          <FormField
            control={form.control}
            name="observations"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-tooltip="Informações adicionais">Observações</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          {checkingCompliance && (
            <div className="text-sm text-gray-500">Verificando compliance...</div>
          )}
          {compliance && (
            <div className="text-sm border rounded-md p-2 space-y-1">
              <div>SEFAZ: {compliance.sefazActive ? 'Ativo' : 'Inativo'}</div>
              <div>
                SERASA Score: {compliance.serasaScore}
                {compliance.serasaBlocked && ' (Bloqueado)'}
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              type="button"
              className="px-4 py-2 border rounded-md"
              onClick={() => {
                setCompliance(null);
                onOpenChange(false);
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={createVendor.isPending}
            >
              Salvar
            </button>
          </DialogFooter>
        </form>
      </Form>
      </DialogContent>
    </Dialog>
  );
};

