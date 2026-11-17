# Guia de Contribuição

Obrigado pelo interesse em contribuir com o TEAM AF Mat Control!

Este documento estabelece as diretrizes para contribuir com o projeto, garantindo organização, rastreabilidade e consistência durante o desenvolvimento.

## 1. Pré-requisitos

Antes de contribuir, recomenda-se ter:

- Git instalado e configurado.
- Conta no GitHub.
- Conhecimento básico de Git e GitHub.
- Ambiente de desenvolvimento compatível com as tecnologias utilizadas pelo projeto.

Os requisitos específicos de execução serão documentados conforme a aplicação for implementada.

## 2. Processo de contribuição

Todas as contribuições devem seguir o fluxo estabelecido pelo projeto:

1. Criar uma Issue descrevendo o objetivo, contexto, escopo e critérios de aceite.
2. Revisar e aprovar o escopo antes de iniciar a implementação.
3. Criar uma branch específica para a Issue.
4. Implementar somente as alterações previstas no escopo aprovado.
5. Executar as validações aplicáveis.
6. Abrir um Pull Request relacionado à Issue.
7. Submeter as alterações à revisão.
8. Integrar as alterações na branch principal após aprovação.

A branch `main` deve permanecer protegida contra alterações diretas.

## 3. Convenção de branches

As branches devem utilizar nomes descritivos, associados ao número da Issue.

Padrões adotados:

| Tipo | Convenção |
|---|---|
| Feature | `feature/<issue-number>-<feature-name>` |
| Correção | `fix/<issue-number>-<description>` |
| Documentação | `docs/<issue-number>-<description>` |
| Manutenção | `chore/<issue-number>-<description>` |

Exemplos:

- `feature/1-repository-foundation`
- `fix/12-timer-reset`
- `docs/15-update-architecture`
- `chore/20-update-dependencies`

Utilize nomes em inglês, letras minúsculas e hífens como separadores.

## 4. Convenção de commits

O projeto adota o padrão Conventional Commits.

Formato:

`<type>: <description>`

Tipos recomendados:

| Tipo | Finalidade |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de problema |
| `docs` | Alterações na documentação |
| `style` | Alterações de formatação sem impacto funcional |
| `refactor` | Refatoração de código |
| `test` | Inclusão ou alteração de testes |
| `chore` | Tarefas de manutenção e configuração |
| `build` | Alterações no processo de build |
| `ci` | Alterações em pipelines e automações |

Exemplos:

- `feat: add training timer`
- `fix: correct timer reset behavior`
- `docs: update project documentation`
- `chore: configure repository settings`
- `ci: add pull request validation workflow`

As mensagens devem ser objetivas e descrever claramente a alteração realizada.

## 5. Diretrizes de desenvolvimento

Durante a implementação:

- Respeite o escopo aprovado na Issue.
- Prefira soluções simples e de fácil manutenção.
- Evite introduzir dependências sem necessidade justificada.
- Preserve funcionalidades existentes.
- Mantenha a organização e os padrões definidos no repositório.
- Atualize a documentação quando houver mudanças relevantes.
- Não inclua credenciais, tokens ou informações sensíveis no código.

## 6. Validação e testes

Antes de abrir um Pull Request:

- Execute os testes aplicáveis.
- Verifique possíveis erros de formatação.
- Revise as alterações realizadas.
- Confirme que não existem arquivos temporários ou informações sensíveis no commit.
- Verifique se os critérios de aceite da Issue foram atendidos.

As validações específicas serão ampliadas conforme a aplicação e os respectivos pipelines forem implementados.

## 7. Pull Requests

Todo Pull Request deve:

- Estar relacionado a uma Issue existente.
- Possuir título objetivo e descritivo.
- Apresentar o objetivo das alterações.
- Descrever as implementações realizadas.
- Informar as validações executadas.
- Indicar eventuais limitações ou pendências.
- Utilizar a palavra-chave `Closes #N` na descrição para fechar automaticamente a Issue relacionada após o merge.

Os Pull Requests devem ser direcionados à branch `main`.

A integração deverá ocorrer somente após as revisões e verificações exigidas pelo projeto.

## 8. Código de Conduta

Todos os participantes devem respeitar as diretrizes estabelecidas no [Código de Conduta](CODE_OF_CONDUCT.md).

A participação no projeto pressupõe colaboração respeitosa, comunicação construtiva e responsabilidade nas interações.
