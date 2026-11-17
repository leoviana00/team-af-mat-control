
# TEAM AF Mat Control

Plataforma web para controle e organização das atividades diárias no tatame de Jiu-Jitsu.

O TEAM AF Mat Control reúne ferramentas para auxiliar instrutores e operadores no gerenciamento de treinos, rounds, pontuação de lutas e organização das aulas.

## Objetivo

Disponibilizar uma interface centralizada para operação dos treinos, com suporte a diferentes dispositivos e possibilidade de utilização em telas de exibição.

## Módulos da plataforma

| Módulo | Descrição | Status |
|---|---|---|
| Training Timer | Cronômetros para treinos, rounds e intervalos. | Planejado |
| Match Scoreboard | Placar de lutas com pontos, vantagens e punições. | Planejado |
| Interval Training | Controle de ciclos de atividade e descanso. | Planejado |
| Class Management | Organização das etapas e atividades da aula. | Planejado |

A interface inicial e a navegação entre os módulos já estão implementadas. As funcionalidades operacionais serão desenvolvidas incrementalmente.

## Tecnologias

- React
- TypeScript
- Vite
- ESLint
- CSS
- GitHub Actions
- GitHub Pages (publicação planejada/configurada)

## Requisitos

- Node.js 24 ou superior
- npm

## Executar localmente

Clone o repositório:

```bash
git clone git@github.com:leoviana00/team-af-mat-control.git
cd team-af-mat-control
```

Instale as dependências:

```bash
npm ci
```

Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

A aplicação estará disponível no endereço informado pelo Vite, normalmente:

```text
http://localhost:5173/
```

## Scripts disponíveis

| Comando | Finalidade |
|---|---|
| `npm run dev` | Inicia o ambiente de desenvolvimento. |
| `npm run lint` | Executa a análise estática com ESLint. |
| `npm run typecheck` | Valida os tipos TypeScript. |
| `npm run build` | Gera o build de produção. |
| `npm run preview` | Executa uma prévia local do build. |

Para gerar a versão de produção:

```bash
npm run build
```

Os arquivos serão gerados no diretório `dist/`.

## Estrutura do projeto

```text
team-af-mat-control/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── codeql.yml
│       ├── pages.yml
│       └── security.yml
├── public/
│   └── assets/
├── src/
│   ├── app/
│   │   ├── layouts/
│   │   └── routes/
│   ├── components/
│   │   ├── navigation/
│   │   └── ui/
│   ├── features/
│   │   ├── training-timer/
│   │   ├── match-scoreboard/
│   │   ├── interval-training/
│   │   └── class-management/
│   ├── hooks/
│   ├── services/
│   ├── styles/
│   ├── types/
│   └── main.tsx
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts
```

A organização segue uma abordagem orientada a funcionalidades (*feature-based*), mantendo cada módulo isolado para facilitar sua evolução.

## CI/CD e publicação

O projeto utiliza GitHub Actions para automatizar as validações e a publicação.

### CI — Repository Validation

Executa validações em Pull Requests direcionados à `main` e em atualizações da branch principal:

- Instalação das dependências com `npm ci`.
- ESLint.
- Verificação de tipos TypeScript e build.
- Validação de arquivos YAML.
- Validação de Markdown.
- Validação dos workflows com Actionlint.
- Verificação de whitespace.

### Security

Os workflows de segurança incluem verificações automatizadas com Gitleaks, Zizmor e CodeQL.

### GitHub Pages

O workflow `pages.yml` prepara o build e a publicação automática após atualizações na `main`.

Endereço planejado:

[https://leoviana00.github.io/team-af-mat-control/](https://leoviana00.github.io/team-af-mat-control/)

A publicação depende da habilitação do GitHub Pages nas configurações do repositório.

## Arquitetura e evolução

A arquitetura está sendo desenvolvida incrementalmente.

Diretrizes previstas para as próximas etapas:

- Sincronização em tempo real entre dispositivos.
- Salas compartilhadas de treino.
- Perfis de acesso para administração, operação, visualização e display.
- Persistência de configurações e histórico.
- Integração com Firebase, conforme evolução do projeto.

Esses recursos ainda não fazem parte da implementação inicial.

## Desenvolvimento

As contribuições devem seguir o fluxo de trabalho do repositório:

1. Criar uma branch a partir da `main`.
2. Implementar a alteração dentro do escopo da issue correspondente.
3. Executar as validações locais.
4. Abrir um Pull Request.
5. Aguardar as verificações automatizadas e revisão.
6. Integrar à `main` após aprovação.

Consulte [CONTRIBUTING.md](CONTRIBUTING.md) para as diretrizes de contribuição.

## Licença

Consulte as informações de licença definidas no repositório.

---

<p align="center">
  Desenvolvido por <strong>Leonardo Viana</strong>
</p>