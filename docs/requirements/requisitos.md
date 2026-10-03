# Requisitos e Regras de Negócio — nassauTickets

## 1. Objetivo

Este documento organiza os requisitos funcionais, requisitos não funcionais e regras de negócio do Sistema de Controle de Atendimento do Laboratório de Análises Clínicas.

## 2. Requisitos Funcionais

| ID | Requisito |
|---|---|
| RF01 | O sistema deve permitir a emissão de senhas pelo totem. |
| RF02 | O sistema deve permitir os tipos de senha SP, SG e SE. |
| RF03 | O sistema deve gerar a numeração no formato `YYMMDD-PPSQ`. |
| RF04 | O sistema deve controlar a fila de atendimento. |
| RF05 | O sistema deve selecionar a próxima senha de acordo com as regras de prioridade. |
| RF06 | O atendente deve poder chamar uma nova senha. |
| RF07 | O atendente deve poder chamar uma senha novamente. |
| RF08 | O atendente deve poder iniciar um atendimento. |
| RF09 | O atendente deve poder finalizar um atendimento. |
| RF10 | O sistema deve permitir o acompanhamento das cinco últimas chamadas no painel. |
| RF11 | O sistema deve controlar os estados das senhas. |
| RF12 | O sistema deve considerar uma senha como não comparecida após duas chamadas sem atendimento. |
| RF13 | O sistema deve possuir login para o atendente. |
| RF14 | O sistema deve possuir perfil adicional de gestor. |
| RF15 | O gestor deve poder realizar os cadastros previstos. |
| RF16 | O sistema deve disponibilizar relatórios diário e mensal. |
| RF17 | Os relatórios devem apresentar quantitativos gerais e por prioridade. |
| RF18 | O sistema deve apresentar relatório detalhado das senhas. |
| RF19 | O sistema deve apresentar o tempo médio de atendimento. |
| RF20 | O sistema deve registrar informações para auditoria. |
| RF21 | O sistema deve emitir áudio durante as chamadas, informando prioridade, senha e guichê. |
| RF22 | O sistema deve repetir o áudio ao utilizar “Chamar Novamente”, precedido por “Última chamada”. |
| RF23 | O sistema deve tratar a concorrência entre atendentes ao solicitar a próxima senha. |
| RF24 | O sistema deve definir o comportamento do frontend e do painel em caso de falha do backend ou banco de dados. |

## 3. Requisitos Não Funcionais

### RNF01 — Segurança
O sistema deve possuir autenticação para o atendente. O acesso às funcionalidades deve respeitar os perfis definidos.

### RNF02 — Privacidade e LGPD
O cliente deve interagir anonimamente pelo totem. Os dados de atendimento devem ser tratados de acordo com a legislação vigente e com os princípios aplicáveis da LGPD.

### RNF03 — Disponibilidade
O sistema deve definir comportamento adequado para o frontend e o painel quando ocorrer falha no backend ou no banco de dados.

### RNF04 — Desempenho
O sistema deve atualizar as informações de chamadas e filas de maneira adequada ao atendimento em tempo real, sem prejudicar o fluxo de atendimento.

### RNF05 — Concorrência
O sistema deve tratar o cenário em que dois ou mais atendentes solicitam a próxima senha praticamente ao mesmo tempo, garantindo que uma mesma senha não seja direcionada indevidamente para mais de um atendimento.

### RNF06 — Auditoria
As operações relevantes de atendimento devem permitir rastrear atendente, guichê, senha e horários das etapas do atendimento.

### RNF07 — Acessibilidade
As interfaces do sistema devem considerar a legislação e as boas práticas aplicáveis de acessibilidade.

### RNF08 — Tecnologia
O frontend deve utilizar React. A infraestrutura indicada permite MySQL 8.0 e backend com Node.js LTS 22/Express, Java 21/Spring Boot ou Python 3.14/Flask/FastAPI.

## 4. Regras de Negócio

### RN01 — Prioridade das senhas
A ordem de atendimento deve seguir:

`SP → SE/SG → SP → SE/SG`

Quando houver uma SP na fila, ela possui prioridade. Em seguida deve ser considerada uma SE, quando disponível, e então uma SG.

### RN02 — Tipos de senha
- **SP:** Senha Prioritária.
- **SG:** Senha Geral.
- **SE:** Senha para retirada de Exames.

### RN03 — Guichês
Qualquer guichê pode atender qualquer tipo de senha.

### RN04 — Abandono
Após duas chamadas sem comparecimento do cliente, a senha deve ser considerada abandonada e passar para `NÃO_COMPARECEU`.

### RN05 — Expediente
O expediente ocorre das 7h às 17h.

### RN06 — Encerramento do expediente
Atendimentos já iniciados devem ser concluídos pelo atendente. Senhas que permanecerem na fila ao final do expediente devem ser descartadas.

### RN07 — Painel
O painel deve mostrar as cinco últimas senhas chamadas e não deve exibir a próxima senha.

### RN08 — Numeração
A senha deve seguir o padrão `YYMMDD-PPSQ`, no qual:
- YY = ano com dois dígitos;
- MM = mês;
- DD = dia;
- PP = tipo da senha;
- SQ = sequência de três dígitos, reiniciada diariamente.

### RN09 — Relatórios
O sistema deve produzir informações diárias e mensais sobre emissão, atendimento, prioridades, tempos e auditoria.

### RN10 — Estados
A senha deve seguir a máquina de estados definida na especificação:
`EMITIDA → AGUARDANDO → CHAMADA → CHAMADA_NOVAMENTE → EM_ATENDIMENTO → ATENDIDA`, podendo chegar a `NÃO_COMPARECEU`.

## 5. Observação sobre a especificação

Os requisitos acima foram organizados a partir dos documentos fornecidos para a atividade e da especificação do sistema. Aspectos como segurança, disponibilidade, auditoria, desempenho, concorrência, LGPD e acessibilidade são exigidos pela atividade e devem ser considerados na implementação e na documentação do projeto.
