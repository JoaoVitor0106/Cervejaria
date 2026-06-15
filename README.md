# 🍺 Cervejaria — Sistema de Gestão para Cervejarias Artesanais

Aplicação web desenvolvida com **React + Vite** e **Firebase** para gerenciamento de cervejas artesanais, estilos, lotes de produção e relatórios.

## ✨ Funcionalidades

- **Landing Page** pública com catálogo de cervejas
- **Autenticação** via Firebase Auth (login protegido)
- **CRUD de Cervejas** — cadastro, edição e exclusão de cervejas
- **CRUD de Estilos** — gerenciamento de estilos de cerveja
- **CRUD de Lotes** — controle de lotes de produção com status
- **Relatórios** — visão consolidada de produção
- **Rotas protegidas** — área administrativa acessível apenas após login

## 🛠️ Tecnologias

- [React 19](https://react.dev/)
- [Vite 8](https://vitejs.dev/)
- [React Router DOM 7](https://reactrouter.com/)
- [Firebase 12](https://firebase.google.com/) (Auth + Firestore)

---

## 🚀 Como rodar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- Uma conta no [Firebase](https://firebase.google.com/) com um projeto criado

### 1. Clone o repositório

```bash
git clone https://github.com/JoaoVitor0106/Cervejaria.git
cd Cervejaria
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com as credenciais do seu projeto Firebase:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com os valores do seu projeto (encontrados em **Project Settings > General > Your apps** no Console do Firebase):

```env
VITE_FIREBASE_API_KEY="sua_api_key"
VITE_FIREBASE_AUTH_DOMAIN="seu_projeto.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="seu_projeto_id"
VITE_FIREBASE_STORAGE_BUCKET="seu_projeto.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="seu_sender_id"
VITE_FIREBASE_APP_ID="seu_app_id"
```

### 4. Configure o Firebase

No console do Firebase, certifique-se de ter habilitado:

- **Authentication** → método de login **E-mail/Senha**
- **Firestore Database** — crie o banco em modo de produção ou teste

As regras do Firestore já estão configuradas no arquivo [`firestore.rules`](./firestore.rules) (leitura e escrita abertas para fins de desenvolvimento).

### 5. (Opcional) Popular o banco de dados com dados iniciais

Se quiser iniciar com dados de exemplo (3 estilos, 3 cervejas e 3 lotes), execute:

```bash
node seed-db.js
```

> ⚠️ O script só insere dados se o banco estiver vazio. Em caso de dados já existentes, a operação é cancelada automaticamente.

### 6. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

---

## 📁 Estrutura do Projeto

```
cervejaria/
├── public/              # Arquivos estáticos públicos
├── src/
│   ├── assets/          # Imagens e recursos
│   ├── components/      # Componentes reutilizáveis (Navbar, ProtectedRoute...)
│   ├── pages/           # Páginas da aplicação
│   │   ├── LandingPage.jsx
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── CrudCervejas.jsx
│   │   ├── CrudEstilos.jsx
│   │   ├── CrudLotes.jsx
│   │   └── Relatorio.jsx
│   ├── firebase.js      # Configuração e inicialização do Firebase
│   ├── App.jsx          # Rotas da aplicação
│   └── main.jsx         # Ponto de entrada
├── seed-db.js           # Script para popular o banco com dados iniciais
├── .env.example         # Modelo de variáveis de ambiente
├── firestore.rules      # Regras de segurança do Firestore
└── vite.config.js       # Configuração do Vite
```

## 📜 Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção na pasta `dist/` |
| `npm run preview` | Visualiza o build de produção localmente |
| `npm run lint` | Executa o ESLint para verificar o código |
| `node seed-db.js` | Popula o Firestore com dados iniciais de exemplo |

## 🔒 Rotas

| Rota | Acesso | Descrição |
|---|---|---|
| `/` | Público | Landing page com catálogo |
| `/login` | Público | Página de autenticação |
| `/admin/dashboard` | Protegido | Painel administrativo |
| `/admin/cervejas` | Protegido | Gestão de cervejas |
| `/admin/estilos` | Protegido | Gestão de estilos |
| `/admin/lotes` | Protegido | Gestão de lotes |
| `/admin/relatorio` | Protegido | Relatórios de produção |
