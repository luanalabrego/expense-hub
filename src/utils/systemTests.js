// Sistema de testes automatizados para validação do sistema
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../services/firebase';

// Classe para executar testes do sistema
export class SystemTester {
  constructor() {
    this.results = [];
    this.errors = [];
    this.warnings = [];
  }

  // Adicionar resultado de teste
  addResult(testName, passed, message, details = null) {
    const result = {
      testName,
      passed,
      message,
      details,
      timestamp: new Date(),
    };
    
    this.results.push(result);
    
    if (!passed) {
      this.errors.push(result);
    }
    
    console.log(`${passed ? '✅' : '❌'} ${testName}: ${message}`);
    if (details) {
      console.log('   Details:', details);
    }
  }

  // Adicionar aviso
  addWarning(testName, message, details = null) {
    const warning = {
      testName,
      message,
      details,
      timestamp: new Date(),
    };
    
    this.warnings.push(warning);
    console.log(`⚠️  ${testName}: ${message}`);
  }

  // Teste de conectividade com Firestore
  async testFirestoreConnection() {
    try {
      const testQuery = query(collection(db, 'users'), limit(1));
      await getDocs(testQuery);
      this.addResult(
        'Firestore Connection',
        true,
        'Conexão com Firestore estabelecida com sucesso'
      );
    } catch (error) {
      this.addResult(
        'Firestore Connection',
        false,
        'Falha na conexão com Firestore',
        error.message
      );
    }
  }

  // Teste de dados básicos
  async testBasicData() {
    const collections = [
      { name: 'users', minCount: 1 },
      { name: 'vendors', minCount: 1 },
      { name: 'costCenters', minCount: 1 },
      { name: 'categories', minCount: 1 },
    ];

    for (const col of collections) {
      try {
        const snapshot = await getDocs(collection(db, col.name));
        const count = snapshot.size;
        
        if (count >= col.minCount) {
          this.addResult(
            `Data - ${col.name}`,
            true,
            `${count} registros encontrados`,
            { count, collection: col.name }
          );
        } else {
          this.addResult(
            `Data - ${col.name}`,
            false,
            `Apenas ${count} registros encontrados, mínimo esperado: ${col.minCount}`,
            { count, expected: col.minCount }
          );
        }
      } catch (error) {
        this.addResult(
          `Data - ${col.name}`,
          false,
          `Erro ao verificar coleção ${col.name}`,
          error.message
        );
      }
    }
  }

  // Teste de integridade de dados
  async testDataIntegrity() {
    try {
      // Verificar se todos os centros de custo têm gerentes válidos
      const costCentersSnapshot = await getDocs(collection(db, 'costCenters'));
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      const userIds = new Set();
      usersSnapshot.forEach(doc => userIds.add(doc.id));
      
      let invalidManagers = 0;
      costCentersSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.managerId && !userIds.has(data.managerId)) {
          invalidManagers++;
        }
      });
      
      if (invalidManagers === 0) {
        this.addResult(
          'Data Integrity - Cost Center Managers',
          true,
          'Todos os gerentes de centro de custo são válidos'
        );
      } else {
        this.addResult(
          'Data Integrity - Cost Center Managers',
          false,
          `${invalidManagers} centros de custo com gerentes inválidos`,
          { invalidCount: invalidManagers }
        );
      }
      
      // Verificar se todas as solicitações têm fornecedores válidos
      const requestsSnapshot = await getDocs(collection(db, 'requests'));
      const vendorsSnapshot = await getDocs(collection(db, 'vendors'));
      
      const vendorIds = new Set();
      vendorsSnapshot.forEach(doc => vendorIds.add(doc.id));
      
      let invalidVendors = 0;
      requestsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.vendorId && !vendorIds.has(data.vendorId)) {
          invalidVendors++;
        }
      });
      
      if (invalidVendors === 0) {
        this.addResult(
          'Data Integrity - Request Vendors',
          true,
          'Todos os fornecedores das solicitações são válidos'
        );
      } else {
        this.addResult(
          'Data Integrity - Request Vendors',
          false,
          `${invalidVendors} solicitações com fornecedores inválidos`,
          { invalidCount: invalidVendors }
        );
      }
      
    } catch (error) {
      this.addResult(
        'Data Integrity',
        false,
        'Erro ao verificar integridade dos dados',
        error.message
      );
    }
  }

  // Teste de políticas de aprovação
  async testApprovalPolicies() {
    try {
      const policiesSnapshot = await getDocs(
        query(collection(db, 'approvalPolicies'), where('active', '==', true))
      );
      
      if (policiesSnapshot.empty) {
        this.addResult(
          'Approval Policies',
          false,
          'Nenhuma política de aprovação ativa encontrada'
        );
        return;
      }
      
      let validPolicies = 0;
      let invalidPolicies = 0;
      
      policiesSnapshot.forEach(doc => {
        const policy = doc.data();
        
        // Verificar se a política tem aprovadores
        if (!policy.approvers || policy.approvers.length === 0) {
          invalidPolicies++;
          return;
        }
        
        // Verificar se os valores min/max são válidos
        if (policy.minAmount < 0 || policy.maxAmount < policy.minAmount) {
          invalidPolicies++;
          return;
        }
        
        validPolicies++;
      });
      
      if (invalidPolicies === 0) {
        this.addResult(
          'Approval Policies',
          true,
          `${validPolicies} políticas válidas encontradas`
        );
      } else {
        this.addResult(
          'Approval Policies',
          false,
          `${invalidPolicies} políticas inválidas encontradas`,
          { valid: validPolicies, invalid: invalidPolicies }
        );
      }
      
    } catch (error) {
      this.addResult(
        'Approval Policies',
        false,
        'Erro ao verificar políticas de aprovação',
        error.message
      );
    }
  }

  // Teste de orçamentos
  async testBudgets() {
    try {
      const budgetsSnapshot = await getDocs(
        query(collection(db, 'budgets'), where('status', '==', 'active'))
      );
      
      if (budgetsSnapshot.empty) {
        this.addWarning(
          'Budgets',
          'Nenhum orçamento ativo encontrado'
        );
        return;
      }
      
      let validBudgets = 0;
      let invalidBudgets = 0;
      
      budgetsSnapshot.forEach(doc => {
        const budget = doc.data();
        
        // Verificar se os valores são consistentes
        const total = (budget.spentAmount || 0) + (budget.committedAmount || 0) + (budget.availableAmount || 0);
        const plannedAmount = budget.plannedAmount || 0;
        
        if (Math.abs(total - plannedAmount) > 1) { // Tolerância de R$ 1
          invalidBudgets++;
          return;
        }
        
        // Verificar se os valores são não negativos
        if (budget.spentAmount < 0 || budget.committedAmount < 0 || budget.availableAmount < 0) {
          invalidBudgets++;
          return;
        }
        
        validBudgets++;
      });
      
      if (invalidBudgets === 0) {
        this.addResult(
          'Budgets',
          true,
          `${validBudgets} orçamentos válidos encontrados`
        );
      } else {
        this.addResult(
          'Budgets',
          false,
          `${invalidBudgets} orçamentos com inconsistências`,
          { valid: validBudgets, invalid: invalidBudgets }
        );
      }
      
    } catch (error) {
      this.addResult(
        'Budgets',
        false,
        'Erro ao verificar orçamentos',
        error.message
      );
    }
  }

  // Teste de performance de queries
  async testQueryPerformance() {
    const queries = [
      {
        name: 'Users Query',
        query: () => getDocs(query(collection(db, 'users'), limit(10))),
        maxTime: 2000, // 2 segundos
      },
      {
        name: 'Requests Query',
        query: () => getDocs(query(collection(db, 'requests'), orderBy('createdAt', 'desc'), limit(20))),
        maxTime: 3000, // 3 segundos
      },
      {
        name: 'Vendors Query',
        query: () => getDocs(query(collection(db, 'vendors'), where('active', '==', true), limit(10))),
        maxTime: 2000, // 2 segundos
      },
    ];

    for (const testQuery of queries) {
      try {
        const startTime = Date.now();
        await testQuery.query();
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if (duration <= testQuery.maxTime) {
          this.addResult(
            `Performance - ${testQuery.name}`,
            true,
            `Query executada em ${duration}ms`
          );
        } else {
          this.addResult(
            `Performance - ${testQuery.name}`,
            false,
            `Query lenta: ${duration}ms (máximo: ${testQuery.maxTime}ms)`,
            { duration, maxTime: testQuery.maxTime }
          );
        }
      } catch (error) {
        this.addResult(
          `Performance - ${testQuery.name}`,
          false,
          'Erro ao executar query',
          error.message
        );
      }
    }
  }

  // Teste de segurança básica
  async testBasicSecurity() {
    try {
      // Verificar se existem usuários admin
      const adminQuery = query(
        collection(db, 'users'),
        where('role', '==', 'admin'),
        where('active', '==', true)
      );
      const adminSnapshot = await getDocs(adminQuery);
      
      if (adminSnapshot.empty) {
        this.addResult(
          'Security - Admin Users',
          false,
          'Nenhum usuário admin ativo encontrado'
        );
      } else {
        this.addResult(
          'Security - Admin Users',
          true,
          `${adminSnapshot.size} usuário(s) admin ativo(s) encontrado(s)`
        );
      }
      
      // Verificar se existem usuários com papéis válidos
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const validRoles = ['admin', 'finance', 'approver', 'requester', 'viewer'];
      let invalidRoles = 0;
      
      usersSnapshot.forEach(doc => {
        const user = doc.data();
        if (!validRoles.includes(user.role)) {
          invalidRoles++;
        }
      });
      
      if (invalidRoles === 0) {
        this.addResult(
          'Security - User Roles',
          true,
          'Todos os usuários têm papéis válidos'
        );
      } else {
        this.addResult(
          'Security - User Roles',
          false,
          `${invalidRoles} usuário(s) com papéis inválidos`,
          { invalidCount: invalidRoles }
        );
      }
      
    } catch (error) {
      this.addResult(
        'Security',
        false,
        'Erro ao verificar configurações de segurança',
        error.message
      );
    }
  }

  // Executar todos os testes
  async runAllTests() {
    console.log('🚀 Iniciando testes do sistema...\n');
    
    this.results = [];
    this.errors = [];
    this.warnings = [];
    
    const startTime = Date.now();
    
    // Executar testes em sequência
    await this.testFirestoreConnection();
    await this.testBasicData();
    await this.testDataIntegrity();
    await this.testApprovalPolicies();
    await this.testBudgets();
    await this.testQueryPerformance();
    await this.testBasicSecurity();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Gerar relatório
    const summary = this.generateSummary(duration);
    console.log('\n📊 Relatório de Testes:');
    console.log(summary);
    
    return {
      summary,
      results: this.results,
      errors: this.errors,
      warnings: this.warnings,
      duration,
    };
  }

  // Gerar resumo dos testes
  generateSummary(duration) {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const warnings = this.warnings.length;
    
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    
    return {
      total,
      passed,
      failed,
      warnings,
      passRate: parseFloat(passRate),
      duration,
      status: failed === 0 ? 'success' : 'failure',
      message: failed === 0 
        ? `Todos os ${total} testes passaram com sucesso!`
        : `${failed} de ${total} testes falharam.`,
    };
  }

  // Executar teste específico
  async runSpecificTest(testName) {
    console.log(`🔍 Executando teste: ${testName}`);
    
    this.results = [];
    this.errors = [];
    this.warnings = [];
    
    const startTime = Date.now();
    
    switch (testName) {
      case 'connection':
        await this.testFirestoreConnection();
        break;
      case 'data':
        await this.testBasicData();
        break;
      case 'integrity':
        await this.testDataIntegrity();
        break;
      case 'policies':
        await this.testApprovalPolicies();
        break;
      case 'budgets':
        await this.testBudgets();
        break;
      case 'performance':
        await this.testQueryPerformance();
        break;
      case 'security':
        await this.testBasicSecurity();
        break;
      default:
        throw new Error(`Teste desconhecido: ${testName}`);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      results: this.results,
      errors: this.errors,
      warnings: this.warnings,
      duration,
    };
  }
}

// Função utilitária para executar testes
export const runSystemTests = async () => {
  const tester = new SystemTester();
  return await tester.runAllTests();
};

// Função utilitária para executar teste específico
export const runSpecificTest = async (testName) => {
  const tester = new SystemTester();
  return await tester.runSpecificTest(testName);
};

// Exportar classe para uso avançado
export default SystemTester;

