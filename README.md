# Sistema de Aprovação de Pagamentos

Um sistema web completo para gestão de solicitações de pagamento com workflow de aprovação, controle orçamentário e auditoria completa.

## 🚀 Visão Geral

O Sistema de Aprovação de Pagamentos é uma solução corporativa moderna que automatiza e controla todo o processo de solicitação, aprovação e pagamento de despesas empresariais. Desenvolvido com React, TypeScript e Firebase, oferece uma experiência de usuário intuitiva com segurança e auditoria de nível empresarial.

### ✨ Principais Funcionalidades

- **🔐 Autenticação e Autorização**: Sistema robusto com múltiplos papéis e permissões granulares
- **📋 Gestão de Solicitações**: Workflow completo de criação, aprovação e pagamento
- **💰 Controle Orçamentário**: Planejamento, execução e monitoramento em tempo real
- **🏢 Cadastros Básicos**: Fornecedores, centros de custo, categorias e usuários
- **🛡️ Políticas de Aprovação**: Alçadas configuráveis por valor, categoria e centro de custo
- **📊 Dashboard Executivo**: KPIs financeiros e operacionais em tempo real
- **📁 Gestão de Documentos**: Upload, organização e controle de versões
- **🔔 Notificações**: Sistema de alertas e comunicação em tempo real
- **📈 Relatórios e Analytics**: Importação/exportação de dados e relatórios gerenciais
- **🔍 Auditoria Completa**: Rastreabilidade total de todas as ações do sistema

## 🏗️ Arquitetura

### Stack Tecnológico

**Frontend:**
- React 18 com TypeScript
- Vite para build e desenvolvimento
- Tailwind CSS + shadcn/ui para interface
- React Query para gerenciamento de estado
- Zustand para estado global
- React Hook Form para formulários
- Recharts para visualizações

**Backend:**
- Firebase Authentication
- Cloud Firestore (NoSQL)
- Firebase Storage
- Cloud Functions (futuro)

**Ferramentas:**
- ESLint + Prettier para qualidade de código
- React Query DevTools para debugging
- Sistema de testes automatizados

### Estrutura do Projeto

```
payment-approval-system/
├── public/                 # Arquivos públicos
├── src/
│   ├── components/         # Componentes reutilizáveis
│   │   ├── ui/            # Componentes base (shadcn/ui)
│   │   ├── Layout.jsx     # Layout principal
│   │   ├── Header.jsx     # Cabeçalho
│   │   └── Sidebar.jsx    # Menu lateral
│   ├── contexts/          # Contextos React
│   │   └── AuthContext.jsx
│   ├── hooks/             # Hooks customizados
│   │   ├── useUsers.ts
│   │   ├── useRequests.ts
│   │   └── ...
│   ├── lib/               # Configurações de bibliotecas
│   │   └── react-query.ts
│   ├── pages/             # Páginas da aplicação
│   │   ├── DashboardPage.jsx
│   │   ├── RequestsPage.jsx
│   │   └── ...
│   ├── services/          # Serviços de API
│   │   ├── firebase.ts
│   │   ├── users.ts
│   │   └── ...
│   ├── stores/            # Stores Zustand
│   │   ├── auth.ts
│   │   └── ui.ts
│   ├── types/             # Definições TypeScript
│   │   └── index.ts
│   ├── utils/             # Utilitários
│   │   ├── index.ts
│   │   ├── seedData.js
│   │   └── systemTests.js
│   └── routes/            # Configuração de rotas
│       └── index.jsx
├── firestore.rules        # Regras de segurança
├── firestore.indexes.json # Índices do Firestore
└── package.json
```

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js 18+ 
- npm ou pnpm
- Conta Firebase
- Git

### 1. Clone o Repositório

```bash
git clone <repository-url>
cd payment-approval-system
```

### 2. Instale as Dependências

```bash
# Com npm
npm install

# Com pnpm (recomendado)
pnpm install
```

### 3. Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative Authentication, Firestore e Storage
3. Configure os provedores de autenticação (Email/Senha e Google)
4. Copie as configurações do projeto

### 4. Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

Configure as variáveis:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

### 5. Configuração do Firestore

Deploy das regras de segurança e índices:

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar projeto
firebase init firestore

# Deploy das regras e índices
firebase deploy --only firestore:rules,firestore:indexes
```

### 6. Executar o Projeto

```bash
# Desenvolvimento
npm run dev
# ou
pnpm dev

# Build para produção
npm run build
# ou
pnpm build
```

## 👥 Papéis e Permissões

### Admin
- **Acesso Total**: Todas as funcionalidades do sistema
- **Gestão de Usuários**: Criar, editar e desativar usuários
- **Configurações**: Modificar configurações do sistema
- **Auditoria**: Acesso completo aos logs

### Finance
- **Gestão Financeira**: Orçamentos, políticas de aprovação
- **Cadastros Básicos**: Fornecedores, centros de custo, categorias
- **Aprovações**: Aprovar/rejeitar solicitações
- **Pagamentos**: Marcar solicitações como pagas
- **Relatórios**: Acesso a dados financeiros

### Approver
- **Aprovações**: Aprovar/rejeitar dentro da alçada
- **Visualização**: Solicitações e dados relacionados
- **Criação**: Criar solicitações
- **Centros de Custo**: Gerenciar centros atribuídos

### Requester
- **Solicitações**: Criar e editar próprias solicitações
- **Documentos**: Upload de anexos
- **Acompanhamento**: Visualizar status das solicitações

### Viewer
- **Visualização**: Acesso somente leitura
- **Relatórios**: Relatórios básicos permitidos

## 📋 Funcionalidades Principais

### 1. Dashboard Executivo
- KPIs financeiros e operacionais
- Gráficos interativos (Recharts)
- Métricas em tempo real
- Alertas e notificações

### 2. Gestão de Solicitações
- Formulário intuitivo de criação
- Workflow de aprovação automático
- Upload de documentos
- Histórico completo

### 3. Controle Orçamentário
- Planejamento por período
- Controle de execução
- Alertas de estouro
- Relatórios de utilização

### 4. Políticas de Aprovação
- Configuração por valor
- Filtros por categoria/centro de custo
- Múltiplos níveis de aprovação
- Escalação automática

### 5. Sistema de Notificações
- Notificações em tempo real
- Múltiplos tipos (aprovação, orçamento, sistema)
- Centro de notificações
- Configurações personalizáveis

### 6. Auditoria e Compliance
- Logs imutáveis
- Rastreabilidade completa
- Relatórios de compliance
- Controle de acesso granular

## 🔧 Desenvolvimento

### Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev

# Build
pnpm build

# Preview da build
pnpm preview

# Lint
pnpm lint

# Testes (futuro)
pnpm test
```

### Estrutura de Dados

O sistema utiliza as seguintes coleções no Firestore:

- **users**: Usuários do sistema
- **vendors**: Fornecedores
- **costCenters**: Centros de custo
- **categories**: Categorias de despesa
- **requests**: Solicitações de pagamento
- **approvalPolicies**: Políticas de aprovação
- **budgets**: Orçamentos
- **documents**: Documentos e anexos
- **notifications**: Notificações
- **auditLogs**: Logs de auditoria

### Dados de Demonstração

O sistema inclui um gerador de dados de seed para demonstração:

```bash
# Acessar como admin
# Ir para /admin/seed-data
# Clicar em "Popular Banco"
```

Isso criará:
- 7 usuários com diferentes papéis
- 5 fornecedores
- 5 centros de custo
- 7 categorias
- 4 políticas de aprovação
- 3 orçamentos
- 50 solicitações
- Notificações e logs de auditoria

### Testes

Sistema de testes automatizados incluído:

```javascript
import { runSystemTests } from './src/utils/systemTests';

// Executar todos os testes
const results = await runSystemTests();

// Testes específicos
const connectionTest = await runSpecificTest('connection');
```

## 🚀 Deploy

### Opções de Deploy

1. **Vercel** (Recomendado)
2. **Netlify**
3. **Firebase Hosting**
4. **AWS S3 + CloudFront**

### Deploy no Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variáveis de ambiente no dashboard
```

### Deploy no Firebase Hosting

```bash
# Build do projeto
pnpm build

# Deploy
firebase deploy --only hosting
```

## 📚 Documentação Adicional

- [Manual do Usuário](./docs/user-manual.md)
- [Guia de Instalação](./docs/installation-guide.md)
- [Documentação Técnica](./docs/technical-documentation.md)
- [Configuração de Segurança](./firebase-security-config.md)
- [API Reference](./docs/api-reference.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

Para suporte e dúvidas:

- 📧 Email: support@empresa.com
- 📱 WhatsApp: +55 11 99999-9999
- 💬 Slack: #payment-system
- 📖 Wiki: [Internal Wiki](https://wiki.empresa.com/payment-system)

## 🎯 Roadmap

### Versão 2.0 (Futuro)
- [ ] Integração com ERPs
- [ ] API REST completa
- [ ] Mobile app (React Native)
- [ ] Inteligência artificial para aprovações
- [ ] Integração bancária
- [ ] Multi-tenancy
- [ ] Workflow designer visual

### Melhorias Contínuas
- [ ] Testes unitários completos
- [ ] Testes E2E
- [ ] Performance optimization
- [ ] Acessibilidade (WCAG)
- [ ] Internacionalização (i18n)

---

**Desenvolvido com ❤️ pela equipe de desenvolvimento**
