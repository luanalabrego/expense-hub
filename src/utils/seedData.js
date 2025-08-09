// Dados de seed para demonstração do sistema
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase';

// Função para gerar IDs únicos
const generateId = () => Math.random().toString(36).substr(2, 9);

// Função para gerar datas aleatórias
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Função para gerar valores aleatórios
const randomAmount = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Dados de usuários de demonstração
export const seedUsers = [
  {
    id: 'admin-001',
    name: 'João Silva',
    email: 'joao.silva@empresa.com',
    role: 'admin',
    active: true,
    phone: '(11) 99999-0001',
    approvalLimit: 1000000,
    costCenters: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    id: 'finance-001',
    name: 'Maria Santos',
    email: 'maria.santos@empresa.com',
    role: 'finance',
    active: true,
    phone: '(11) 99999-0002',
    approvalLimit: 500000,
    costCenters: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    id: 'approver-001',
    name: 'Carlos Oliveira',
    email: 'carlos.oliveira@empresa.com',
    role: 'approver',
    active: true,
    phone: '(11) 99999-0003',
    approvalLimit: 100000,
    costCenters: ['cc-001', 'cc-002'],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    id: 'approver-002',
    name: 'Ana Costa',
    email: 'ana.costa@empresa.com',
    role: 'approver',
    active: true,
    phone: '(11) 99999-0004',
    approvalLimit: 75000,
    costCenters: ['cc-003', 'cc-004'],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    id: 'requester-001',
    name: 'Pedro Almeida',
    email: 'pedro.almeida@empresa.com',
    role: 'requester',
    active: true,
    phone: '(11) 99999-0005',
    approvalLimit: 0,
    costCenters: ['cc-001'],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    id: 'requester-002',
    name: 'Lucia Ferreira',
    email: 'lucia.ferreira@empresa.com',
    role: 'requester',
    active: true,
    phone: '(11) 99999-0006',
    approvalLimit: 0,
    costCenters: ['cc-002'],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    id: 'viewer-001',
    name: 'Roberto Lima',
    email: 'roberto.lima@empresa.com',
    role: 'viewer',
    active: true,
    phone: '(11) 99999-0007',
    approvalLimit: 0,
    costCenters: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
];

// Dados de fornecedores
export const seedVendors = [
  {
    id: 'vendor-001',
    name: 'Tech Solutions Ltda',
    document: '12.345.678/0001-90',
    email: 'contato@techsolutions.com.br',
    phone: '(11) 3333-1001',
    address: {
      street: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      country: 'Brasil',
    },
    contacts: [
      {
        name: 'João Vendedor',
        email: 'joao@techsolutions.com.br',
        phone: '(11) 99999-1001',
        role: 'Comercial',
      },
    ],
    tags: ['tecnologia', 'software', 'consultoria'],
    rating: 4.5,
    active: true,
    blocked: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'admin-001',
  },
  {
    id: 'vendor-002',
    name: 'Office Supplies S.A.',
    document: '23.456.789/0001-01',
    email: 'vendas@officesupplies.com.br',
    phone: '(11) 3333-2002',
    address: {
      street: 'Rua Augusta, 500',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01305-000',
      country: 'Brasil',
    },
    contacts: [
      {
        name: 'Maria Vendedora',
        email: 'maria@officesupplies.com.br',
        phone: '(11) 99999-2002',
        role: 'Vendas',
      },
    ],
    tags: ['material', 'escritório', 'papelaria'],
    rating: 4.2,
    active: true,
    blocked: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'finance-001',
  },
  {
    id: 'vendor-003',
    name: 'Facilities Management Corp',
    document: '34.567.890/0001-12',
    email: 'contato@facilities.com.br',
    phone: '(11) 3333-3003',
    address: {
      street: 'Av. Faria Lima, 2000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01452-000',
      country: 'Brasil',
    },
    contacts: [
      {
        name: 'Carlos Gestor',
        email: 'carlos@facilities.com.br',
        phone: '(11) 99999-3003',
        role: 'Gerente',
      },
    ],
    tags: ['facilities', 'manutenção', 'limpeza'],
    rating: 4.8,
    active: true,
    blocked: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'admin-001',
  },
  {
    id: 'vendor-004',
    name: 'Marketing Digital Plus',
    document: '45.678.901/0001-23',
    email: 'hello@marketingplus.com.br',
    phone: '(11) 3333-4004',
    address: {
      street: 'Rua Oscar Freire, 300',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01426-000',
      country: 'Brasil',
    },
    contacts: [
      {
        name: 'Ana Marketing',
        email: 'ana@marketingplus.com.br',
        phone: '(11) 99999-4004',
        role: 'Diretora',
      },
    ],
    tags: ['marketing', 'digital', 'publicidade'],
    rating: 4.3,
    active: true,
    blocked: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'finance-001',
  },
  {
    id: 'vendor-005',
    name: 'Consultoria Jurídica Associados',
    document: '56.789.012/0001-34',
    email: 'contato@juridica.com.br',
    phone: '(11) 3333-5005',
    address: {
      street: 'Av. Brigadeiro Faria Lima, 1500',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01451-000',
      country: 'Brasil',
    },
    contacts: [
      {
        name: 'Dr. Pedro Advogado',
        email: 'pedro@juridica.com.br',
        phone: '(11) 99999-5005',
        role: 'Sócio',
      },
    ],
    tags: ['jurídico', 'consultoria', 'advocacia'],
    rating: 4.7,
    active: true,
    blocked: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'admin-001',
  },
];

// Dados de centros de custo
export const seedCostCenters = [
  {
    id: 'cc-001',
    name: 'Tecnologia da Informação',
    code: 'TI-001',
    description: 'Centro de custo para despesas de TI e tecnologia',
    managerId: 'approver-001',
    parentId: null,
    budget: 500000,
    spent: 125000,
    committed: 75000,
    available: 300000,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'admin-001',
  },
  {
    id: 'cc-002',
    name: 'Recursos Humanos',
    code: 'RH-001',
    description: 'Centro de custo para despesas de RH',
    managerId: 'approver-001',
    parentId: null,
    budget: 300000,
    spent: 80000,
    committed: 45000,
    available: 175000,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'finance-001',
  },
  {
    id: 'cc-003',
    name: 'Marketing',
    code: 'MKT-001',
    description: 'Centro de custo para despesas de marketing',
    managerId: 'approver-002',
    parentId: null,
    budget: 400000,
    spent: 150000,
    committed: 100000,
    available: 150000,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'finance-001',
  },
  {
    id: 'cc-004',
    name: 'Operações',
    code: 'OPS-001',
    description: 'Centro de custo para despesas operacionais',
    managerId: 'approver-002',
    parentId: null,
    budget: 600000,
    spent: 200000,
    committed: 150000,
    available: 250000,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'admin-001',
  },
  {
    id: 'cc-005',
    name: 'Administrativo',
    code: 'ADM-001',
    description: 'Centro de custo para despesas administrativas',
    managerId: 'finance-001',
    parentId: null,
    budget: 250000,
    spent: 60000,
    committed: 40000,
    available: 150000,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'admin-001',
  },
];

// Dados de categorias
export const seedCategories = [
  {
    id: 'cat-001',
    name: 'Software e Licenças',
    type: 'OPEX',
    description: 'Despesas com software e licenças',
    icon: 'laptop',
    color: '#3B82F6',
    parentId: null,
    requiresApproval: true,
    approvalLimit: 50000,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'admin-001',
  },
  {
    id: 'cat-002',
    name: 'Material de Escritório',
    type: 'OPEX',
    description: 'Material de escritório e papelaria',
    icon: 'clipboard',
    color: '#10B981',
    parentId: null,
    requiresApproval: false,
    approvalLimit: 5000,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'finance-001',
  },
  {
    id: 'cat-003',
    name: 'Consultoria',
    type: 'OPEX',
    description: 'Serviços de consultoria externa',
    icon: 'users',
    color: '#8B5CF6',
    parentId: null,
    requiresApproval: true,
    approvalLimit: 100000,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'admin-001',
  },
  {
    id: 'cat-004',
    name: 'Marketing e Publicidade',
    type: 'OPEX',
    description: 'Despesas com marketing e publicidade',
    icon: 'megaphone',
    color: '#F59E0B',
    parentId: null,
    requiresApproval: true,
    approvalLimit: 75000,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'finance-001',
  },
  {
    id: 'cat-005',
    name: 'Equipamentos',
    type: 'CAPEX',
    description: 'Aquisição de equipamentos',
    icon: 'monitor',
    color: '#EF4444',
    parentId: null,
    requiresApproval: true,
    approvalLimit: 25000,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'admin-001',
  },
  {
    id: 'cat-006',
    name: 'Treinamento',
    type: 'OPEX',
    description: 'Cursos e treinamentos',
    icon: 'graduation-cap',
    color: '#06B6D4',
    parentId: null,
    requiresApproval: true,
    approvalLimit: 15000,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'finance-001',
  },
  {
    id: 'cat-007',
    name: 'Viagens',
    type: 'OPEX',
    description: 'Despesas com viagens corporativas',
    icon: 'plane',
    color: '#84CC16',
    parentId: null,
    requiresApproval: true,
    approvalLimit: 20000,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'finance-001',
  },
];

// Dados de políticas de aprovação
export const seedApprovalPolicies = [
  {
    id: 'policy-001',
    name: 'Política Geral - Baixo Valor',
    description: 'Aprovação para valores até R$ 10.000',
    priority: 1,
    minAmount: 0,
    maxAmount: 10000,
    categoryIds: [],
    costCenterIds: [],
    approvers: [
      {
        level: 1,
        userIds: ['approver-001', 'approver-002'],
        required: 1,
        parallel: false,
      },
    ],
    conditions: {
      requiresDocuments: false,
      allowSelfApproval: false,
      escalationTimeHours: 48,
    },
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'admin-001',
  },
  {
    id: 'policy-002',
    name: 'Política Geral - Médio Valor',
    description: 'Aprovação para valores de R$ 10.001 a R$ 50.000',
    priority: 2,
    minAmount: 10001,
    maxAmount: 50000,
    categoryIds: [],
    costCenterIds: [],
    approvers: [
      {
        level: 1,
        userIds: ['approver-001', 'approver-002'],
        required: 1,
        parallel: false,
      },
      {
        level: 2,
        userIds: ['finance-001'],
        required: 1,
        parallel: false,
      },
    ],
    conditions: {
      requiresDocuments: true,
      allowSelfApproval: false,
      escalationTimeHours: 24,
    },
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'admin-001',
  },
  {
    id: 'policy-003',
    name: 'Política Geral - Alto Valor',
    description: 'Aprovação para valores acima de R$ 50.000',
    priority: 3,
    minAmount: 50001,
    maxAmount: 999999999,
    categoryIds: [],
    costCenterIds: [],
    approvers: [
      {
        level: 1,
        userIds: ['approver-001', 'approver-002'],
        required: 1,
        parallel: false,
      },
      {
        level: 2,
        userIds: ['finance-001'],
        required: 1,
        parallel: false,
      },
      {
        level: 3,
        userIds: ['admin-001'],
        required: 1,
        parallel: false,
      },
    ],
    conditions: {
      requiresDocuments: true,
      allowSelfApproval: false,
      escalationTimeHours: 12,
    },
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'admin-001',
  },
  {
    id: 'policy-004',
    name: 'Política TI - Software',
    description: 'Aprovação específica para software e licenças',
    priority: 1,
    minAmount: 0,
    maxAmount: 999999999,
    categoryIds: ['cat-001'],
    costCenterIds: ['cc-001'],
    approvers: [
      {
        level: 1,
        userIds: ['approver-001'],
        required: 1,
        parallel: false,
      },
      {
        level: 2,
        userIds: ['finance-001'],
        required: 1,
        parallel: false,
      },
    ],
    conditions: {
      requiresDocuments: true,
      allowSelfApproval: false,
      escalationTimeHours: 24,
    },
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'admin-001',
  },
];

// Dados de orçamentos
export const seedBudgets = [
  {
    id: 'budget-001',
    name: 'Orçamento TI 2024',
    description: 'Orçamento anual do centro de custo de TI',
    year: 2024,
    period: 'annual',
    costCenterId: 'cc-001',
    categoryId: null,
    plannedAmount: 500000,
    spentAmount: 125000,
    committedAmount: 75000,
    availableAmount: 300000,
    breakdown: {
      january: 41667,
      february: 41667,
      march: 41667,
      april: 41667,
      may: 41667,
      june: 41667,
      july: 41667,
      august: 41667,
      september: 41667,
      october: 41667,
      november: 41667,
      december: 41666,
    },
    status: 'active',
    approvedBy: 'admin-001',
    approvedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'finance-001',
  },
  {
    id: 'budget-002',
    name: 'Orçamento Marketing 2024',
    description: 'Orçamento anual do centro de custo de Marketing',
    year: 2024,
    period: 'annual',
    costCenterId: 'cc-003',
    categoryId: null,
    plannedAmount: 400000,
    spentAmount: 150000,
    committedAmount: 100000,
    availableAmount: 150000,
    breakdown: {
      january: 33333,
      february: 33333,
      march: 33333,
      april: 33333,
      may: 33333,
      june: 33333,
      july: 33333,
      august: 33333,
      september: 33333,
      october: 33333,
      november: 33333,
      december: 33334,
    },
    status: 'active',
    approvedBy: 'admin-001',
    approvedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'finance-001',
  },
  {
    id: 'budget-003',
    name: 'Orçamento Software TI Q1 2024',
    description: 'Orçamento trimestral para software e licenças',
    year: 2024,
    period: 'quarterly',
    costCenterId: 'cc-001',
    categoryId: 'cat-001',
    plannedAmount: 150000,
    spentAmount: 45000,
    committedAmount: 30000,
    availableAmount: 75000,
    breakdown: {
      january: 50000,
      february: 50000,
      march: 50000,
    },
    status: 'active',
    approvedBy: 'finance-001',
    approvedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: 'finance-001',
  },
];

// Função para gerar solicitações de demonstração
export const generateSeedRequests = () => {
  const statuses = ['draft', 'pending', 'approved', 'paid', 'rejected', 'cancelled'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const paymentMethods = ['transfer', 'check', 'cash', 'card'];
  
  const requests = [];
  
  for (let i = 1; i <= 50; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    
    const vendorId = seedVendors[Math.floor(Math.random() * seedVendors.length)].id;
    const costCenterId = seedCostCenters[Math.floor(Math.random() * seedCostCenters.length)].id;
    const categoryId = seedCategories[Math.floor(Math.random() * seedCategories.length)].id;
    const createdBy = ['requester-001', 'requester-002', 'approver-001', 'approver-002'][Math.floor(Math.random() * 4)];
    
    const amount = randomAmount(1000, 100000);
    const createdAt = randomDate(new Date(2024, 0, 1), new Date());
    
    const request = {
      id: `request-${String(i).padStart(3, '0')}`,
      requestNumber: `2024${String(i).padStart(4, '0')}`,
      title: `Solicitação de Pagamento ${i}`,
      description: `Descrição detalhada da solicitação ${i} para aprovação`,
      amount,
      vendorId,
      costCenterId,
      categoryId,
      status,
      priority,
      paymentMethod,
      dueDate: status !== 'draft' ? randomDate(new Date(), new Date(2024, 11, 31)) : null,
      notes: `Observações da solicitação ${i}`,
      attachments: [],
      approvals: status === 'approved' || status === 'paid' ? [
        {
          level: 1,
          approverId: 'approver-001',
          approverName: 'Carlos Oliveira',
          status: 'approved',
          comment: 'Aprovado conforme política',
          approvedAt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000),
        },
      ] : [],
      paidAt: status === 'paid' ? new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000) : null,
      createdAt: Timestamp.fromDate(createdAt),
      updatedAt: Timestamp.fromDate(createdAt),
      createdBy,
    };
    
    requests.push(request);
  }
  
  return requests;
};

// Função principal para popular o banco de dados
export const seedDatabase = async () => {
  try {
    console.log('Iniciando população do banco de dados...');
    
    // Usuários
    console.log('Criando usuários...');
    for (const user of seedUsers) {
      await setDoc(doc(db, 'users', user.id), user);
    }
    
    // Fornecedores
    console.log('Criando fornecedores...');
    for (const vendor of seedVendors) {
      await setDoc(doc(db, 'vendors', vendor.id), vendor);
    }
    
    // Centros de custo
    console.log('Criando centros de custo...');
    for (const costCenter of seedCostCenters) {
      await setDoc(doc(db, 'costCenters', costCenter.id), costCenter);
    }
    
    // Categorias
    console.log('Criando categorias...');
    for (const category of seedCategories) {
      await setDoc(doc(db, 'categories', category.id), category);
    }
    
    // Políticas de aprovação
    console.log('Criando políticas de aprovação...');
    for (const policy of seedApprovalPolicies) {
      await setDoc(doc(db, 'approvalPolicies', policy.id), policy);
    }
    
    // Orçamentos
    console.log('Criando orçamentos...');
    for (const budget of seedBudgets) {
      await setDoc(doc(db, 'budgets', budget.id), budget);
    }
    
    // Solicitações
    console.log('Criando solicitações...');
    const requests = generateSeedRequests();
    for (const request of requests) {
      await setDoc(doc(db, 'requests', request.id), request);
    }
    
    // Notificações de exemplo
    console.log('Criando notificações...');
    const notifications = [
      {
        recipientId: 'approver-001',
        type: 'approval_request',
        title: 'Nova solicitação para aprovação',
        message: 'Solicitação #202400001 aguarda sua aprovação',
        priority: 'medium',
        read: false,
        actionUrl: '/requests/request-001',
        metadata: {
          requestId: 'request-001',
          amount: 25000,
        },
        createdAt: serverTimestamp(),
      },
      {
        recipientId: 'requester-001',
        type: 'approval_response',
        title: 'Solicitação aprovada',
        message: 'Sua solicitação #202400002 foi aprovada',
        priority: 'low',
        read: false,
        actionUrl: '/requests/request-002',
        metadata: {
          requestId: 'request-002',
          approver: 'Carlos Oliveira',
        },
        createdAt: serverTimestamp(),
      },
      {
        recipientId: 'finance-001',
        type: 'budget_alert',
        title: 'Alerta de orçamento',
        message: 'Centro de custo TI atingiu 80% do orçamento',
        priority: 'high',
        read: false,
        actionUrl: '/budgets/budget-001',
        metadata: {
          budgetId: 'budget-001',
          utilization: 80,
        },
        createdAt: serverTimestamp(),
      },
    ];
    
    for (const notification of notifications) {
      await addDoc(collection(db, 'notifications'), notification);
    }
    
    // Logs de auditoria de exemplo
    console.log('Criando logs de auditoria...');
    const auditLogs = [
      {
        action: 'login',
        entity: 'user',
        entityId: 'admin-001',
        entityName: 'João Silva',
        actorId: 'admin-001',
        actorName: 'João Silva',
        actorEmail: 'joao.silva@empresa.com',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: serverTimestamp(),
        metadata: {
          sessionId: 'session-001',
          loginMethod: 'email',
        },
      },
      {
        action: 'create',
        entity: 'request',
        entityId: 'request-001',
        entityName: 'Solicitação de Pagamento 1',
        actorId: 'requester-001',
        actorName: 'Pedro Almeida',
        actorEmail: 'pedro.almeida@empresa.com',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: serverTimestamp(),
        metadata: {
          amount: 25000,
          vendorId: 'vendor-001',
        },
      },
      {
        action: 'approve',
        entity: 'request',
        entityId: 'request-001',
        entityName: 'Solicitação de Pagamento 1',
        actorId: 'approver-001',
        actorName: 'Carlos Oliveira',
        actorEmail: 'carlos.oliveira@empresa.com',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: serverTimestamp(),
        metadata: {
          level: 1,
          comment: 'Aprovado conforme política',
        },
      },
    ];
    
    for (const log of auditLogs) {
      await addDoc(collection(db, 'auditLogs'), log);
    }
    
    console.log('✅ Banco de dados populado com sucesso!');
    console.log(`
📊 Dados criados:
- ${seedUsers.length} usuários
- ${seedVendors.length} fornecedores  
- ${seedCostCenters.length} centros de custo
- ${seedCategories.length} categorias
- ${seedApprovalPolicies.length} políticas de aprovação
- ${seedBudgets.length} orçamentos
- 50 solicitações
- ${notifications.length} notificações
- ${auditLogs.length} logs de auditoria
    `);
    
    return {
      success: true,
      message: 'Dados de demonstração criados com sucesso!',
      counts: {
        users: seedUsers.length,
        vendors: seedVendors.length,
        costCenters: seedCostCenters.length,
        categories: seedCategories.length,
        approvalPolicies: seedApprovalPolicies.length,
        budgets: seedBudgets.length,
        requests: 50,
        notifications: notifications.length,
        auditLogs: auditLogs.length,
      },
    };
    
  } catch (error) {
    console.error('❌ Erro ao popular banco de dados:', error);
    throw error;
  }
};

// Função para limpar dados de demonstração
export const clearSeedData = async () => {
  try {
    console.log('Limpando dados de demonstração...');
    
    const collections = [
      'users',
      'vendors', 
      'costCenters',
      'categories',
      'approvalPolicies',
      'budgets',
      'requests',
      'notifications',
      'auditLogs',
    ];
    
    for (const collectionName of collections) {
      console.log(`Limpando coleção ${collectionName}...`);
      // Implementar limpeza se necessário
    }
    
    console.log('✅ Dados de demonstração removidos com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error);
    throw error;
  }
};

