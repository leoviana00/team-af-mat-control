# TEAM AF Mat Control

**Plataforma de controle e organização das atividades diárias do tatame.**

O TEAM AF Mat Control é uma aplicação web projetada para apoiar a rotina de academias e equipes de Jiu-Jitsu, oferecendo ferramentas simples e integradas para controlar treinos, lutas e aulas.

O projeto tem como objetivo disponibilizar uma interface prática, acessível por computadores, tablets, celulares e televisores, priorizando a utilização durante as atividades no tatame.

## Objetivos do projeto

- Centralizar ferramentas de controle das atividades do tatame.
- Facilitar a condução de treinos e aulas.
- Disponibilizar um placar digital para simulação e acompanhamento de lutas.
- Permitir o compartilhamento de sessões entre diferentes dispositivos.
- Oferecer uma interface clara e adequada para exibição em televisores.
- Manter uma solução simples, acessível e de baixo custo operacional.

## Funcionalidades

O escopo inicial contempla quatro funcionalidades principais:

### 1. Cronômetro de Treino (Training Timer)

Ferramenta para controlar o tempo das atividades de treinamento.

Funcionalidades previstas:

- Contagem crescente e regressiva.
- Configuração de rounds e intervalos.
- Alertas sonoros.
- Presets de treinamento.

### 2. Placar de Luta (Match Scoreboard)

Placar digital para acompanhamento de lutas de Jiu-Jitsu.

Funcionalidades previstas:

- Identificação dos atletas nas posições vermelha e azul.
- Registro de pontos, vantagens e punições.
- Cronômetro integrado.
- Histórico de ações.
- Possibilidade de desfazer a última ação.

### 3. Treino Intervalado (Interval Training)

Ferramenta para organização de exercícios intervalados.

Funcionalidades previstas:

- Configuração do tempo de atividade.
- Configuração do tempo de descanso.
- Definição da quantidade de ciclos.
- Alertas sonoros.
- Repetição automática dos ciclos.

### 4. Controle de Aula (Class Management)

Ferramenta para organizar e conduzir a sequência de atividades de uma aula.

Funcionalidades previstas:

- Organização das etapas da aula.
- Definição de duração por atividade.
- Visualização da etapa atual e da próxima atividade.
- Controle de avanço entre etapas.
- Integração com o mecanismo de cronômetro.

Exemplos de atividades: aquecimento, mobilidade, técnica, drills e rola.

## Recursos transversais

Além dos quatro modos principais, o projeto prevê:

- Salas compartilhadas por código de acesso.
- Sincronização em tempo real entre dispositivos.
- Modo de exibição dedicado para televisores.
- Perfis de administrador, operador, visualizador e display.
- Transferência do controle de uma sessão entre operadores.
- Personalização da identidade visual da academia.
- Histórico básico de sessões.
- Reconexão e sincronização após perda de conexão.

## Arquitetura planejada

A proposta inicial prioriza uma arquitetura simples, com hospedagem estática e serviços gerenciados, evitando a necessidade de manter infraestrutura própria.

| Componente | Tecnologia planejada |
|---|---|
| Frontend | React |
| Linguagem | TypeScript |
| Hospedagem | GitHub Pages |
| Sincronização em tempo real | Firebase Realtime Database |
| Persistência local | LocalStorage / IndexedDB |
| Controle de versão | Git e GitHub |
| Automação | GitHub Actions |

A arquitetura poderá evoluir conforme as necessidades do produto, sem introduzir complexidade prematuramente.

## Identidade visual

A identidade visual será baseada na marca TEAM AF, preservando sua logo original e utilizando uma interface predominantemente escura.

Diretrizes iniciais:

- Preto e grafite como cores predominantes.
- Vermelho como cor principal de identidade.
- Azul para identificação do atleta azul no placar.
- Tipografia esportiva, forte e legível.
- Interface responsiva e adequada para telas de diferentes tamanhos.

## Desenvolvimento e colaboração

O desenvolvimento será organizado por funcionalidades (Features), utilizando Issues e Pull Requests para garantir rastreabilidade e controle das entregas.

Fluxo de desenvolvimento:

1. Criação da Issue com objetivo, escopo e critérios de aceite.
2. Análise e aprovação da Feature.
3. Criação de uma branch específica.
4. Implementação e validação.
5. Abertura de Pull Request relacionado à Issue.
6. Revisão e integração na branch principal.

As entregas deverão respeitar o escopo aprovado para cada Issue.

## Status do projeto

**Fase atual:** Repository Foundation.

O projeto está em fase inicial de estruturação do repositório, documentação e definição dos padrões de desenvolvimento.

As funcionalidades descritas neste documento representam o escopo planejado e não necessariamente estão implementadas.

## Licença

Este projeto está licenciado sob os termos da licença MIT. Consulte o arquivo [LICENSE](LICENSE) para mais informações.
