# TEAM AF MAT CONTROL — Roadmap

> Documento de referência para continuidade do desenvolvimento.

## 1. Direção do produto

**Prioridade atual:** disponibilizar as ferramentas operacionais necessárias para conduzir uma aula de Jiu-Jitsu no tatame.

A fase atual contempla quatro módulos funcionais:

1. Training Timer
2. Interval Training
3. Match Scoreboard
4. Class Management

Concluir esses módulos antes de investir em Firebase, autenticação, salas compartilhadas ou sincronização em tempo real.

## 2. Módulos e ordem de execução

### Feature 3 — Training Timer

**Status:** concluído.

Implementado, validado e integrado à `main`.

Inclui cronômetro de treino, modelos predefinidos, Modo TV e ajustes para dispositivos móveis.

### Feature 4 — Interval Training

**Status:** concluído.

Implementado, validado, publicado e Issue fechada.

Inclui intervalos repetidos, sequência de exercícios, modelos personalizados, persistência local, alertas sonoros e Modo TV.

### Feature 5 — Match Scoreboard

**Status:** implementação concluída e validada. Revisão Git final pendente.

Implementado na branch `feature/12-match-scoreboard`.

Inclui:

- Cronômetro configurável.
- Placar para atleta azul e atleta branca.
- Registro de pontos.
- Registro de vantagens.
- Registro de punições.
- Encerramento da luta e indicação do resultado.
- Formas de encerramento por pontuação, finalização, desclassificação ou decisão do árbitro.
- Interface responsiva e Modo TV.
- Operação local, sem sincronização em tempo real.

**Validação funcional:** concluída.

**Validação técnica:**
- `npm run typecheck` aprovado.
- `npm run test` aprovado — 126 testes, 10 arquivos de teste.
- `npm run build` aprovado.

A integração visual no `App.tsx` foi revisada. O placar está registrado como módulo disponível e operacional.

**Situação Git:** branch da feature revisada parcialmente. Revisão final dos arquivos e preparação do fechamento ainda pendentes. Não considerar integrada à `main` até que isso seja confirmado.

### Feature 6 — Class Management

**Status:** próxima feature planejada.

Desenvolver a organização e condução das etapas de uma aula.

Escopo candidato:

- Organização das etapas da aula.
- Configuração de duração.
- Navegação entre etapas.
- Modelos de aula reutilizáveis.
- Planejamento de blocos de treino.

O planejamento de aulas deverá contemplar blocos como:

- Aquecimento.
- Técnica.
- Drills.
- Rounds de treino.
- Mobilidade e encerramento.

Cada bloco poderá representar atividades por tempo, repetições, distância ou rounds, conforme definição funcional da feature.

A ideia de modelos de aquecimento e sequências de exercícios será incorporada à especificação da Feature 6.

## 3. Próxima ação — Feature 6: Class Management

Antes de iniciar a implementação:

1. Consolidar a especificação funcional.
2. Definir o modelo de dados e os tipos de bloco.
3. Definir o comportamento de duração e navegação entre etapas.
4. Estabelecer critérios de aceite.
5. Criar a Issue no GitHub.
6. Revisar a estrutura atual do repositório.
7. Criar uma branch própria a partir da `main`.
8. Iniciar a implementação incremental.

**Não iniciar a implementação antes de concluir a especificação e criar a Issue.**

Antes de iniciar a Feature 6, concluir a revisão e o fechamento da Feature 5 conforme o fluxo Git do projeto.

## 4. Princípios de implementação

- Manter os módulos funcionalmente independentes.
- Reutilizar componentes ou serviços genéricos somente quando houver comportamento realmente comum.
- Não acoplar novos módulos ao hook, estado ou interface do Training Timer ou Interval Training.
- Preservar o comportamento existente dos módulos concluídos.
- Qualquer extração compartilhada deverá ser acompanhada de testes de regressão.
- Trabalhar por Issue e branch próprias, com escopo e critérios de aceite definidos antes do código.
- Não criar commits, pushes, merges ou PRs sem autorização explícita.

## 5. Fora da fase atual

Os seguintes recursos permanecem no roadmap futuro:

- Firebase.
- Autenticação.
- Sincronização em tempo real.
- Salas compartilhadas.
- Perfis e permissões.
- Histórico centralizado.
- Relatórios.

Esses recursos não devem ser introduzidos como dependências dos módulos operacionais atuais.

## 6. Padrão de conclusão de cada feature

- Implementação conforme escopo aprovado.
- Testes automatizados aprovados.
- `npm run typecheck` aprovado.
- `npm run lint` aprovado.
- `npm run test` aprovado.
- `npm run build` aprovado.
- Validação funcional e responsiva.
- Documentação atualizada.
- Pull Request revisado e integrado à `main`.

## 7. Instrução de retomada

Ao retomar este projeto:

1. Consultar este roadmap.
2. Confirmar o estado real do repositório.
3. Verificar Issues, branches e integração na `main`.
4. Confirmar o escopo da feature em andamento.
5. Prosseguir de forma incremental, sem presumir que etapas foram concluídas.

**Próximo passo planejado:** concluir a revisão Git e o fechamento da Feature 5 — Match Scoreboard. Em seguida, iniciar o levantamento funcional da Feature 6 — Class Management.

Não considerar a Feature 5 integrada à `main` até confirmar a integração no repositório.