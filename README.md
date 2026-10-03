<<<<<<< HEAD
# nassauTickets

## Descrição
O **nassauTickets** é um Sistema de Controle de Atendimento desenvolvido para um Laboratório de Análises Clínicas. Este projeto tem como foco o controle de emissão, fila, chamada e atendimento de senhas.

## Objetivo
Consolidar os conhecimentos de desenvolvimento Web, organização de projetos, Git/GitHub, documentação e integração entre frontend e backend, garantindo o atendimento adequado às regras de negócio e de prioridade estabelecidas pelo laboratório.

## Membros
| Nome | Matrícula | Papel |
| :--- | :--- | :--- |
| Hugo Tenorio Verçoza | 01805685 | Scrum Master / Desenvolvedor |
| Bruna Beatriz Maria Souza Simões | 01850090 | Desenvolvedora / Documentadora |
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
=======
# nassauTickets
>>>>>>> origin/dev
