# Política de Segurança

## 1. Objetivo

A segurança do TEAM AF Mat Control é uma preocupação contínua durante o desenvolvimento e a manutenção do projeto.

Este documento estabelece orientações para identificação, comunicação e tratamento de possíveis vulnerabilidades de segurança.

## 2. Comunicação de vulnerabilidades

Caso identifique uma possível vulnerabilidade de segurança, não abra uma Issue pública contendo detalhes técnicos que possam facilitar sua exploração.

Utilize o recurso de comunicação privada de vulnerabilidades disponibilizado pelo GitHub:

[Reportar uma vulnerabilidade](https://github.com/leoviana00/team-af-mat-control/security/advisories/new)

Se o recurso não estiver disponível, entre em contato privadamente com os mantenedores do projeto.

## 3. Informações para o relato

Sempre que possível, inclua:

- Descrição da vulnerabilidade identificada.
- Componente ou funcionalidade afetada.
- Passos necessários para reproduzir o problema.
- Impacto potencial.
- Evidências técnicas, como logs ou capturas de tela, sem expor dados sensíveis.
- Sugestões de mitigação, caso existam.

Não inclua senhas, tokens, chaves privadas ou dados pessoais reais no relato.

## 4. Divulgação responsável

Solicitamos que vulnerabilidades sejam comunicadas privadamente antes de qualquer divulgação pública.

O responsável pelo relato deverá evitar explorar a vulnerabilidade além do necessário para demonstrar sua existência, acessar dados de terceiros ou comprometer a disponibilidade dos serviços.

A divulgação pública deverá ocorrer somente após alinhamento com os mantenedores e tratamento adequado do problema.

## 5. Escopo de segurança

As avaliações de segurança devem considerar, conforme os componentes forem implementados:

- Aplicação web e suas interfaces.
- Controle de acesso e permissões dos participantes.
- Salas compartilhadas e sincronização em tempo real.
- Firebase Realtime Database e suas regras de segurança.
- Armazenamento local de dados.
- Dependências e bibliotecas utilizadas.
- Pipelines de CI/CD e configurações do repositório.
- Proteção de credenciais, tokens e informações sensíveis.

## 6. Diretrizes de segurança para desenvolvimento

Os colaboradores devem observar as seguintes práticas:

- Nunca versionar credenciais, tokens ou chaves privadas.
- Utilizar variáveis de ambiente para configurações sensíveis.
- Aplicar o princípio do menor privilégio.
- Validar dados recebidos pela aplicação.
- Implementar regras de acesso adequadas aos recursos compartilhados.
- Manter dependências atualizadas.
- Avaliar vulnerabilidades nas dependências e ferramentas utilizadas.
- Evitar exposição de informações sensíveis em logs.
- Revisar alterações que possam impactar a segurança antes do merge.

## 7. Tratamento de vulnerabilidades

Os mantenedores serão responsáveis por analisar os relatos recebidos e definir as ações necessárias.

O tratamento poderá envolver:

1. Confirmação e análise da vulnerabilidade.
2. Avaliação do impacto e da criticidade.
3. Definição de estratégia de correção ou mitigação.
4. Implementação e validação da correção.
5. Comunicação sobre o tratamento realizado.
6. Divulgação responsável, quando aplicável.

A prioridade de tratamento será definida conforme o risco identificado.

## 8. Responsabilidades

Todos os colaboradores são responsáveis por seguir as diretrizes de segurança estabelecidas pelo projeto e comunicar possíveis vulnerabilidades identificadas.

Os mantenedores são responsáveis por avaliar os relatos e coordenar as ações de tratamento.

## 9. Referências

- [GitHub Security Advisories](https://docs.github.com/en/code-security/security-advisories)
- [GitHub — Reporting a vulnerability](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-fixing-vulnerabilities)
- [OWASP Foundation](https://owasp.org/)
