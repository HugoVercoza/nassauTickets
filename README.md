# nassauTickets

## Descrição
O **nassauTickets** é um Sistema de Controle de Atendimento desenvolvido para um Laboratório de Análises Clínicas. Este projeto tem como foco o controle de emissão, fila, chamada e atendimento de senhas.

## Objetivo
Consolidar os conhecimentos de desenvolvimento Web, organização de projetos, Git/GitHub, documentação e integração entre frontend e backend, garantindo o atendimento adequado às regras de negócio e de prioridade estabelecidas pelo laboratório.

## Membros
| Nome | Matrícula | Papel |
| :--- | :--- | :--- |
| Hugo Tenorio Verçoza | 01805685 | Scrum Master / Desenvolvedor |
| Bruna Beatriz Maria Souza Simões | 01850090 | Desenvolvedor |
| Kalinne Vitória Sá de Barros | 01849503 | Testadora |
| Kauã Willams Domingos Marinho | 01849379 | Desenvolvedor |
| Rosana Vitória Lima de Araújo | 01853967 | Testadora / Documentadora |


## Tecnologias Utilizadas
* **Frontend:** React (v18+), React Router DOM (para roteamento SPA), Recharts (para visualização de dados no Dashboard).
* **Backend:** Node.js com Express.
* **Banco de Dados:** MySQL 8.0


## Justificativa da Escolha do Backend
Optamos por utilizar **Node.js LTS com Express** no desenvolvimento do backend. A escolha justifica-se tecnicamente pela unificação da linguagem no projeto, uma vez que o frontend foi construído em **React (JavaScript)**. Isso facilita a integração assíncrona, o consumo de APIs REST baseadas em JSON e a padronização do código entre a equipe, além de oferecer excelente desempenho para o gerenciamento de requisições concorrentes da fila de atendimento.


## Arquitetura e Visão Geral do Sistema
O sistema opera com três agentes principais:
* **AS (Agente Sistema):** Executa ações computacionais, comunica-se com o banco de dados, emite senhas e atualiza o painel.
* **AA (Agente Atendente):** Aciona o sistema para chamar o próximo cliente e realiza o atendimento no guichê.
* **AC (Agente Cliente):** Emite a senha no totem e aguarda a chamada no painel.

O fluxo de atendimento segue a prioridade: SP (Senha Prioritária) -> SE (Retirada de Exames) -> SG (Senha Geral).


## Instruções de Instalação e Configuração
Para configurar o ambiente de desenvolvimento local, certifique-se de ter o Node.js e o MySQL instalados.

1. Clone o repositório:
   `git clone https://github.com/HugoVercoza/nassauTickets.git`

## Instruções de Execução

**Frontend:**
1. Acesse o diretório: `cd frontend`
2. Instale as dependências: `npm install`
3. Inicie o servidor: `npm run dev`

**Backend:**
1. Acesse o diretório: `cd backend`
2. Instale as dependências: `npm install`
3. Inicie o servidor: `node index.js`

## Informações sobre Branches
O projeto utiliza um fluxo de versionamento baseado em duas branches principais:
* **`main`:** Contém o código estável e pronto para produção.
* **`dev`:** Branch principal de desenvolvimento, onde as novas funcionalidades e correções são integradas antes de irem para a `main`.

Todo o desenvolvimento é realizado na branch `dev` (ou em branches auxiliares que fazem merge para a `dev`) e, posteriormente, integrado à `main` através de Pull Requests / Merge.

## Execução da versão integrada

Backend: executar `npm ci` e `npm start` na pasta `backend`.
Frontend: executar `npm ci` e `npm run dev` na pasta `frontend`.

A API de atendimento utiliza persistência local em JSON.
A integração dessas rotas com MySQL permanece pendente.

Acesso de demonstração:
- Email: atendente@nassau.test
- Senha: NassauAV2!

## Contrato da API

- **URL Base:** `http://localhost:3000` (configurável via `VITE_API_URL` no `.env`)

| Método | Endpoint | Descrição | Retorno Esperado |
| :--- | :--- | :--- | :--- |
| `POST` | `/login` ou `/api/login` | Autentica atendente ou gestor | `200 OK` com token e dados do usuário (`tipo`) |
| `GET` | `/api/senhas` | Lista todas as senhas registradas | `200 OK` com array de senhas |
| `POST` | `/api/senhas` | Emite nova senha (`SP`, `SG`, `SE`) dentro do expediente (07h–17h) | `201 Created` com objeto da senha |
| `POST` | `/api/atendimento/proxima` | Chama próxima senha obedecendo prioridade `[SP] -> [SE] -> [SG]` | `200 OK` com senha chamada |
| `PATCH` | `/api/senhas/:id` | Altera estado (`repetir`, `iniciar`, `finalizar`, `ausente`) | `200 OK` com senha atualizada |
| `PATCH` | `/api/senhas/encerrar-expediente` | Descarta senhas pendentes na fila ao fim do expediente | `200 OK` com contagem de descartadas |
| `GET` / `POST` | `/api/usuarios` | Lista e cadastra usuários (`ATENDENTE` ou `GESTOR`) | `200 OK` / `201 Created` |
| `GET` / `POST` | `/api/guiches` | Lista e cadastra guichês de atendimento | `200 OK` / `201 Created` |
| `PATCH` | `/api/guiches/:id/estado` | Abre ou fecha um guichê (`ABERTO` / `FECHADO`) | `200 OK` |

## Evolução da AV1 para a AV2

| Aspecto | Situação na AV1 | Evolução na AV2 | Evidência |
| :--- | :--- | :--- | :--- |
| **Persistência de Dados** | Armazenamento exclusivo em `localStorage` no navegador | Integração com API REST Node.js/Express, MySQL e contingência local | `backend/index.js`, `backend/config/database.js` |
| **Autenticação e Perfis** | Telas livres sem controle de sessão ou perfil | Tela de login, proteção de rotas por perfil (`ATENDENTE` vs `GESTOR`) | `protectedRoute.jsx`, `MenuNavegacao.jsx` |
| **Regras de Expediente** | Emissão permitida a qualquer hora | Bloqueio de emissão fora do horário comercial (07h–17h) e encerramento de fila | `utils/expediente.js`, `adminController.js` |
| **Painel e Chamadas** | Atualização apenas na mesma aba via `localStorage` | Sincronização em tempo real via Server-Sent Events (SSE) e síntese de voz | `GET /api/chamadas/stream`, `audioService.js` |

## Limitações e Contingência

- **Contingência de Banco de Dados:** Caso o serviço MySQL esteja indisponível no ambiente de apresentação, o backend mantém fallback em arquivo (`dados-runtime.json`) e credenciais de contingência, enquanto o frontend preserva leitura local via `localStorage`.
- **Ambiente Local:** Arquivos `.env` não são versionados no Git por segurança; utilize `.env.example` como modelo.

## Uso de Inteligência Artificial

- Ferramentas de IA generativa foram utilizadas como apoio na revisão de código, ajustes estéticos na criação do css, estruturação de rotas REST, elaboração de testes de integração e organização da documentação técnica, com validação manual de todas as regras de negócio pela equipe.