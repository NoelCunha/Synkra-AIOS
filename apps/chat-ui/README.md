# AIOS Chat UI

Interface web de chat para o Synkra AIOS que utiliza o Claude Code CLI como backend de LLM.

## Funcionalidades

- 💬 **Chat em tempo real** - Streaming de respostas do Claude Code
- 📜 **Histórico persistente** - Conversas salvas localmente
- 🎨 **Interface moderna** - Design dark mode com Tailwind CSS
- ⚡ **Respostas em streaming** - Veja a resposta sendo gerada em tempo real
- 📁 **Diretório de trabalho** - Configure o contexto do projeto

## Pré-requisitos

- Node.js 18+
- Claude Code CLI instalado e configurado
  ```bash
  npm install -g @anthropic-ai/claude-code
  ```

## Instalação

```bash
# Navegar para o diretório do app
cd apps/chat-ui

# Instalar dependências
npm install
```

## Uso

### Modo Desenvolvimento

```bash
# Iniciar servidor backend e frontend simultaneamente
npm run dev
```

Isso irá:
- Iniciar o servidor backend na porta `3001`
- Iniciar o frontend Vite na porta `5173`

Acesse: **http://localhost:5173**

### Modo Produção

```bash
# Build do frontend
npm run build

# Iniciar servidor (serve frontend buildado)
npm start
```

Acesse: **http://localhost:3001**

## Arquitetura

```
apps/chat-ui/
├── server/                 # Backend Node.js + Express
│   ├── index.js           # Servidor principal + WebSocket
│   └── history.js         # Gerenciamento de histórico
├── src/                    # Frontend React + TypeScript
│   ├── components/
│   │   ├── ChatArea.tsx   # Área principal de chat
│   │   ├── ChatInput.tsx  # Input de mensagens
│   │   ├── Header.tsx     # Cabeçalho
│   │   ├── Message.tsx    # Componente de mensagem
│   │   └── Sidebar.tsx    # Sidebar com histórico
│   ├── stores/
│   │   └── chatStore.ts   # Estado global (Zustand)
│   ├── App.tsx
│   └── main.tsx
├── .chat-history/          # Conversas salvas (JSON)
└── package.json
```

## Como Funciona

1. **Frontend** envia mensagem via WebSocket
2. **Backend** executa `claude --print` com a mensagem
3. **Output** é transmitido em streaming de volta ao frontend
4. **Histórico** é salvo em arquivos JSON locais

## Configuração

### Diretório de Trabalho

Você pode especificar um diretório de trabalho no header da interface. Isso define o contexto do projeto para o Claude Code CLI.

### Portas

- Frontend (dev): `5173`
- Backend: `3001`

Para alterar a porta do backend, use a variável de ambiente:
```bash
PORT=4000 npm run dev:server
```

## Tecnologias

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand
- **Backend**: Express, Socket.IO
- **CLI**: Claude Code CLI

## Troubleshooting

### Claude Code não encontrado

Certifique-se de que o Claude Code CLI está instalado globalmente:
```bash
claude --version
```

### Conexão WebSocket falha

Verifique se o servidor backend está rodando na porta correta.

### Histórico não persiste

Verifique permissões de escrita no diretório `.chat-history/`.

---

Parte do projeto [Synkra AIOS](https://github.com/SynkraAI/aios-core)
