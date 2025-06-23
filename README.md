# MeuCrud - Sistema de Calculo para indicadores
Sistema web completo para gestão de avaliações, desempenho e usuários, com painéis para administradores, coordenadores e colaboradores. Desenvolvido em Node.js, Express, Prisma ORM, EJS e MySQL.

## Índice

- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Modelos de Dados](#modelos-de-dados)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Instalação e Uso](#instalação-e-uso)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Fluxo de Usuário](#fluxo-de-usuário)
- [Exportação de Dados](#exportação-de-dados)
- [Telas do Sistema](#telas-do-sistema)
- [Licença](#licença)

---

## Funcionalidades

- **Autenticação de usuários** (login/logout, sessões)
- **Gestão de usuários** (criação, edição, exclusão, listagem)
- **Painel administrativo** com métricas (detratores, TMA/TME, checklist, satisfação, etc.) e filtros por colaborador, mês, ano e semana
- **Avaliações de desempenho** individuais e por área
- **Exportação de dados** para Excel e PDF
- **Controle de permissões** por papel: Gente e Gestão (admin), Coordenador, Colaborador
- **Interface moderna** e responsiva com EJS e Chart.js

---

## Tecnologias Utilizadas

- **Node.js** + **Express** (backend)
- **Prisma ORM** (acesso ao banco de dados MySQL)
- **EJS** (templates server-side)
- **Chart.js** (gráficos dinâmicos)
- **ExcelJS** e **PDFKit** (exportação)
- **bcrypt** (hash de senhas)
- **express-session** (sessões)
- **dotenv** (variáveis de ambiente)
- **moment** (datas)
- **express-validator** (validação)

---

## Modelos de Dados

### User

- `id` (UUID)
- `nome`, `email`, `senha`
- `cargo` (JUNIOR, PLENO, COORDENADOR, GENTE_E_GESTAO)
- `role` (COLABORADOR, COORDENADOR, GENTE_E_GESTAO)
- `coordenadorId` (relacionamento)
- `performances`, `avaliacoes` (relacionamentos)

### Performance

- `id` (UUID)
- `colaboradorId`, `registradorId`
- `mes`, `ano`
- Métricas: `detrator`, `checklist`, `tmeTma`, etc.

### PerformanceEvaluation

- `id` (auto)
- `colaboradorId`, `mes`, `ano`
- Métricas: `detratorIndividual`, `detratorArea`, `checklist`, `tmaTme`, etc.

---

## Estrutura de Pastas

```
MeuCrud/
  ├── src/
  │   ├── app.js                # Inicialização do servidor Express
  │   ├── controllers/          # Lógica das rotas
  │   ├── services/             # Lógica de negócio e acesso ao banco
  │   ├── routes/               # Definição das rotas Express
  │   ├── middleware/           # Middlewares de autenticação e autorização
  │   ├── views/                # Templates EJS (admin, coordenador, colaborador)
  │   └── public/               # Arquivos estáticos (JS, CSS, imagens)
  ├── prisma/
  │   ├── schema.prisma         # Modelos de dados Prisma
  │   └── migrations/           # Migrações do banco
  ├── package.json
  └── README.md
```

---

## Instalação e Uso

1. **Clone o repositório:**
   ```bash
   git clone <url>
   cd MeuCrud
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure o banco de dados:**
   - Crie um banco MySQL e configure a variável `DATABASE_URL` no `.env`:
     ```
     DATABASE_URL="mysql://usuario:senha@localhost:3306/nome_do_banco"
     SESSION_SECRET="sua_chave_secreta"
     ```

4. **Rode as migrações e seeds:**
   ```bash
   npx prisma migrate deploy
   npm run seed
   ```

5. **Inicie o servidor:**
   ```bash
   npm run dev
   # ou
   npm start
   ```

6. **Acesse:**  
   http://localhost:3000

---

## Scripts Disponíveis

- `npm start` — Inicia o servidor em modo produção
- `npm run dev` — Inicia com nodemon (hot reload)
- `npm run seed` — Popula o banco com dados iniciais

---

## Fluxo de Usuário

- **Login:** `/login`
- **Redirecionamento automático** para o painel conforme o papel do usuário:
  - Gente e Gestão: `/admin/dashboard`
  - Coordenador: `/coordenador/dashboard`
  - Colaborador: `/colaborador/dashboard`
- **Gestão de usuários:** `/admin/usuarios`
- **Avaliações:**  
  - Admin: `/admin/avaliacoes`
  - Coordenador: `/coordenador/avaliacoes`
  - Colaborador: `/colaborador/avaliacoes`

---

## Exportação de Dados

- **Excel:** `/export/excel`
- **PDF:** `/export/pdf`

---

## Telas do Sistema

- **Login:** Autenticação de usuários
- **Dashboard Admin:** Métricas, filtros, gráficos, exportação, gestão de usuários
- **Dashboard Coordenador:** Visualização e avaliação de colaboradores, criação de usuários
- **Dashboard Colaborador:** Visualização de avaliações e desempenho próprio
- **Gestão de Usuários:** Listagem, criação, edição e exclusão (admin e coordenador)
- **Avaliações:** Visualização detalhada e exportação

---

## Licença

Este projeto é privado. Para uso comercial, entre em contato com o autor. 
