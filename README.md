
# TEAM AF Mat Control

Plataforma web para controle e organizaÃ§Ã£o das atividades diÃ¡rias no tatame de Jiu-Jitsu.

O TEAM AF Mat Control reÃºne ferramentas para auxiliar instrutores e operadores no gerenciamento de treinos, rounds, pontuaÃ§Ã£o de lutas e organizaÃ§Ã£o das aulas.

## Objetivo

Disponibilizar uma interface centralizada para operaÃ§Ã£o dos treinos, com suporte a diferentes dispositivos e possibilidade de utilizaÃ§Ã£o em telas de exibiÃ§Ã£o.

## MÃ³dulos da plataforma

| MÃ³dulo | DescriÃ§Ã£o | Status |
|---|---|---|
| Training Timer | CronÃ´metros para treinos, rounds e intervalos. | Planejado |
| Match Scoreboard | Placar de lutas com pontos, vantagens e puniÃ§Ãµes. | Planejado |
| Interval Training | Controle de ciclos de atividade e descanso. | Planejado |
| Class Management | OrganizaÃ§Ã£o das etapas e atividades da aula. | Planejado |

A interface inicial e a navegaÃ§Ã£o entre os mÃ³dulos jÃ¡ estÃ£o implementadas. As funcionalidades operacionais serÃ£o desenvolvidas incrementalmente.

## Tecnologias

- React
- TypeScript
- Vite
- ESLint
- CSS
- GitHub Actions
- GitHub Pages (publicaÃ§Ã£o planejada/configurada)

## Requisitos

- Node.js 24 ou superior
- npm

## Executar localmente

Clone o repositÃ³rio:

```bash
git clone git@github.com:leoviana00/team-af-mat-control.git
cd team-af-mat-control
```

Instale as dependÃªncias:

```bash
npm ci
```

Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

A aplicaÃ§Ã£o estarÃ¡ disponÃ­vel no endereÃ§o informado pelo Vite, normalmente:

```text
http://localhost:5173/
```

## Scripts disponÃ­veis

| Comando | Finalidade |
|---|---|
| `npm run dev` | Inicia o ambiente de desenvolvimento. |
| `npm run lint` | Executa a anÃ¡lise estÃ¡tica com ESLint. |
| `npm run typecheck` | Valida os tipos TypeScript. |
| `npm run build` | Gera o build de produÃ§Ã£o. |
| `npm run preview` | Executa uma prÃ©via local do build. |

Para gerar a versÃ£o de produÃ§Ã£o:

```bash
npm run build
```

Os arquivos serÃ£o gerados no diretÃ³rio `dist/`.

## Estrutura do projeto

```text
team-af-mat-control/
â”œâ”€â”€ .github/
â”‚   â””â”€â”€ workflows/
â”‚       â”œâ”€â”€ ci.yml
â”‚       â”œâ”€â”€ codeql.yml
â”‚       â”œâ”€â”€ pages.yml
â”‚       â””â”€â”€ security.yml
â”œâ”€â”€ public/
â”‚   â””â”€â”€ assets/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”œâ”€â”€ layouts/
â”‚   â”‚   â””â”€â”€ routes/
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ navigation/
â”‚   â”‚   â””â”€â”€ ui/
â”‚   â”œâ”€â”€ features/
â”‚   â”‚   â”œâ”€â”€ training-timer/
â”‚   â”‚   â”œâ”€â”€ match-scoreboard/
â”‚   â”‚   â”œâ”€â”€ interval-training/
â”‚   â”‚   â””â”€â”€ class-management/
â”‚   â”œâ”€â”€ hooks/
â”‚   â”œâ”€â”€ services/
â”‚   â”œâ”€â”€ styles/
â”‚   â”œâ”€â”€ types/
â”‚   â””â”€â”€ main.tsx
â”œâ”€â”€ index.html
â”œâ”€â”€ package.json
â”œâ”€â”€ package-lock.json
â”œâ”€â”€ tsconfig.json
â””â”€â”€ vite.config.ts
```

A organizaÃ§Ã£o segue uma abordagem orientada a funcionalidades (*feature-based*), mantendo cada mÃ³dulo isolado para facilitar sua evoluÃ§Ã£o.

## CI/CD e publicaÃ§Ã£o

O projeto utiliza GitHub Actions para automatizar as validaÃ§Ãµes e a publicaÃ§Ã£o.

### CI â€” Repository Validation

Executa validaÃ§Ãµes em Pull Requests direcionados Ã  `main` e em atualizaÃ§Ãµes da branch principal:

- InstalaÃ§Ã£o das dependÃªncias com `npm ci`.
- ESLint.
- VerificaÃ§Ã£o de tipos TypeScript e build.
- ValidaÃ§Ã£o de arquivos YAML.
- ValidaÃ§Ã£o de Markdown.
- ValidaÃ§Ã£o dos workflows com Actionlint.
- VerificaÃ§Ã£o de whitespace.

### Security

Os workflows de seguranÃ§a incluem verificaÃ§Ãµes automatizadas com Gitleaks, Zizmor e CodeQL.

### GitHub Pages

O workflow `pages.yml` prepara o build e a publicaÃ§Ã£o automÃ¡tica apÃ³s atualizaÃ§Ãµes na `main`.

EndereÃ§o planejado:

[https://leoviana00.github.io/team-af-mat-control/](https://leoviana00.github.io/team-af-mat-control/)

A publicaÃ§Ã£o depende da habilitaÃ§Ã£o do GitHub Pages nas configuraÃ§Ãµes do repositÃ³rio.

## Arquitetura e evoluÃ§Ã£o

A arquitetura estÃ¡ sendo desenvolvida incrementalmente.

Diretrizes previstas para as prÃ³ximas etapas:

- SincronizaÃ§Ã£o em tempo real entre dispositivos.
- Salas compartilhadas de treino.
- Perfis de acesso para administraÃ§Ã£o, operaÃ§Ã£o, visualizaÃ§Ã£o e display.
- PersistÃªncia de configuraÃ§Ãµes e histÃ³rico.
- IntegraÃ§Ã£o com Firebase, conforme evoluÃ§Ã£o do projeto.

Esses recursos ainda nÃ£o fazem parte da implementaÃ§Ã£o inicial.

## Desenvolvimento

As contribuiÃ§Ãµes devem seguir o fluxo de trabalho do repositÃ³rio:

1. Criar uma branch a partir da `main`.
2. Implementar a alteraÃ§Ã£o dentro do escopo da issue correspondente.
3. Executar as validaÃ§Ãµes locais.
4. Abrir um Pull Request.
5. Aguardar as verificaÃ§Ãµes automatizadas e revisÃ£o.
6. Integrar Ã  `main` apÃ³s aprovaÃ§Ã£o.

Consulte [CONTRIBUTING.md](CONTRIBUTING.md) para as diretrizes de contribuiÃ§Ã£o.

## LicenÃ§a

Consulte as informaÃ§Ãµes de licenÃ§a definidas no repositÃ³rio.

---

Desenvolvido por Leonardo Viana