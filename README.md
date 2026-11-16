# FinEduca

Aplicativo de educação financeira iniciado a partir da exportação do Figma Make. A interface e os fluxos locais existentes foram mantidos; esta base organiza o ambiente e a navegação por URL.

## Ambiente

- Node.js 22 ou superior
- pnpm 10.34.3, fixado em `package.json` e `.mise.toml`

```sh
corepack pnpm install
corepack pnpm dev
```

Comandos disponíveis:

```sh
corepack pnpm check   # verificação de tipos
corepack pnpm build   # build de produção
corepack pnpm preview # prévia local do build
corepack pnpm format  # formatação com oxfmt
```

## Estrutura

- `src/app/routes.ts`: tipos de tela, caminhos e resolução dos destinos
- `src/components/`: componentes visuais reutilizáveis e `AppShell`
- `src/screens/`: telas do protótipo
- `src/data/mockData.ts`: conteúdo demonstrativo usado pelas telas

## Rotas

| Tela | Caminho |
| --- | --- |
| Onboarding | `/` |
| Início | `/home` |
| Finanças | `/finances` |
| Detalhe da transação | `/finances/transactions/:id` |
| Metas | `/goals` |
| Aprender | `/learn` |
| Detalhe do curso | `/learn/courses/:id` |
| Aula | `/learn/lessons/:id` |
| Quiz | `/learn/quiz` |
| Perfil | `/profile` |
| Dados pessoais | `/profile/personal-data` |
| Cadastro financeiro | `/finances/setup/:section` |

## Escopo atual

Os dados continuam demonstrativos e o estado editável existe somente em memória. A aplicação ainda não tem autenticação, persistência ou integração com backend. A escolha dessas partes depende da definição de produto e deve acontecer antes de substituir os mocks.

O Figma MCP não está conectado nesta sessão. O relatório do Copilot também registra que o arquivo Figma Make não pôde ser aberto por esse MCP; por isso, esta etapa preserva os estilos e componentes exportados, mas não confirma a fidelidade ao canvas original. Os artigos exportados têm título e metadados, sem o texto integral.

Para demonstrar o progresso local, um quiz concluído concede 10 XP por resposta correta na primeira tentativa daquela aula; a aprovação continua exigindo 70% de acertos, conforme a tela de quiz existente. A conclusão da aula e o progresso do curso só avançam ao passar. Esses valores são regras de demonstração desta interface e não representam uma política de produto/backend.

## Backend em implementação

A API é desenvolvida em Fastify + TypeScript. O banco é PostgreSQL, acessado por Prisma 7. O esquema está em `prisma/schema.prisma` e a migração inicial versionada em `prisma/migrations/`. A configuração de exemplo fica em `.env.example`; copie-a para `.env` e nunca coloque credenciais reais no Git.

Para desenvolvimento local com Docker instalado:

```sh
corepack pnpm install
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm api:dev
```

No Windows, mantenha as credenciais fora de pastas sincronizadas. Crie `%LOCALAPPDATA%\FinEduca\.env` usando `.env.example` como modelo, substitua o marcador por uma senha aleatória alfanumérica e repita a senha na `DATABASE_URL`. A API e o Prisma leem esse arquivo automaticamente. Para o Compose, sempre informe o arquivo explicitamente:

```powershell
$envPath = Join-Path $env:LOCALAPPDATA 'FinEduca\.env'
docker compose --env-file $envPath config --quiet
docker compose --env-file $envPath up -d postgres
```

Em outro terminal, execute `corepack pnpm dev`. O Vite encaminha `/api` para a API em `localhost:3001`. O endpoint `/api/health/live` verifica o processo; `/api/health/ready` verifica também a conexão com o PostgreSQL.

O modelo registra usuários/perfis/sessões, patrimônio inicial com data de início, transações manuais em centavos, categorias, origens organizacionais opcionais, metas e contribuições declaradas, orçamentos e progresso educacional. Contribuições de metas não são transações. O saldo estimado considera somente receitas e despesas a partir da data-base; movimentações anteriores são recusadas ao registrar e excluídas dos indicadores. O patrimônio, valores livres e reservas de metas aparecem separados na interface. O catálogo de cursos permanece conteúdo estático do protótipo; nenhum dado de demonstração é importado para contas reais.

A API expõe `/api/v1/auth` (cadastro, sessão e logout), `/api/v1/profile`, `/api/v1/finance` (patrimônio-base, categorias, origens, transações e resumo), `/api/v1/goals`, `/api/v1/budgets` e `/api/v1/learning` (progresso e tentativas de quiz). Todos os recursos do usuário exigem sessão, e transações, categorias e origens são limitadas ao proprietário também por relações compostas no PostgreSQL.

## Execução local e funcionamento offline

Novos cadastros recebem categorias iniciais separadas por tipo: Salário, Renda extra, Vendas e Outras receitas; Moradia, Alimentação, Transporte, Saúde, Educação, Lazer, Contas e serviços e Outras despesas. A criação ocorre junto com o cadastro e não modifica contas existentes. O tema claro/escuro é uma preferência local do navegador. A interface não oferece controles de notificações enquanto o recurso não estiver implementado.

O Vite, a API e a porta PostgreSQL do Compose aceitam conexões somente em `127.0.0.1`. A API usa `DATABASE_URL` para acessar o PostgreSQL local; não há provedor externo de autenticação, banco ou sincronização. Google Analytics, scripts externos e telemetria estão desativados. Outfit, Inter e DM Mono são servidas do próprio build, com os textos SIL Open Font License preservados em `src/assets/fonts/`.

Depois de instalar previamente as dependências do Node/Prisma e obter a imagem PostgreSQL do Compose, a aplicação pode ser iniciada sem internet. A aula da regra 50/30/20 mantém um link complementar para o YouTube, que só tenta abrir um serviço externo quando o usuário clica. O projeto ainda não inclui backup/restauração.

### Usuários e dados de demonstração

Para carregar exemplos em um PostgreSQL local recém-configurado, aplique as migrações e execute `corepack pnpm db:seed`. O seed é local, não roda automaticamente, bloqueia `NODE_ENV=production` e preserva integralmente qualquer conta que já exista com o mesmo e-mail. As contas são fictícias e os registros financeiros são apenas exemplos manuais, sem integração ou movimentação bancária.

| Uso | E-mail | Senha |
| --- | --- | --- |
| Exemplo completo com histórico financeiro e educacional | `demo@fineduca.test` | `demo1234demo` |
| Conta sem dados financeiros, para testar o primeiro acesso | `novo@fineduca.test` | `teste1234novo` |

O seed gera transações distribuídas pelos seis meses anteriores e pelo mês atual, conforme a data de execução. Em outro dispositivo, instale as dependências, configure um PostgreSQL local, aplique as migrações e execute o mesmo comando `corepack pnpm db:seed`; os exemplos serão recriados nesse banco. Não distribua essas credenciais em uma implantação de produção.

As configurações de conexão e origem web continuam em variáveis de ambiente para facilitar uma eventual adaptação de implantação. O bind local é uma proteção deliberada nesta etapa; nenhuma hospedagem em nuvem está configurada.

Comandos de qualidade da API: `corepack pnpm check`, `corepack pnpm api:test`, `corepack pnpm api:build` e `corepack pnpm build`. O Compose cria um banco apenas para desenvolvimento, com credenciais não destinadas a produção. A migração está versionada, mas precisa ser aplicada com `db:migrate` em um PostgreSQL ativo antes de testar cadastro, login e persistência.
