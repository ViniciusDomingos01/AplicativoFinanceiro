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
