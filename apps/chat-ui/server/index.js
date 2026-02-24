import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { HistoryManager } from './history.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

const historyManager = new HistoryManager();

// Track active Claude Code processes per session
const activeSessions = new Map();

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/conversations', async (req, res) => {
  try {
    const conversations = await historyManager.listConversations();
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/conversations/:id', async (req, res) => {
  try {
    const conversation = await historyManager.getConversation(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/conversations/:id', async (req, res) => {
  try {
    await historyManager.deleteConversation(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.IO handling
io.on('connection', (socket) => {
  console.log(`[AIOS Chat] Client connected: ${socket.id}`);

  let currentProcess = null;
  let currentConversationId = null;

  socket.on('start-conversation', async (data) => {
    try {
      const { conversationId, workingDirectory } = data;
      currentConversationId = conversationId;

      // Create or load conversation
      await historyManager.createConversation(conversationId, workingDirectory);

      socket.emit('conversation-started', { conversationId });
    } catch (error) {
      console.error('[AIOS Chat] Error starting conversation:', error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('send-message', async (data) => {
    const { message, conversationId, workingDirectory } = data;

    if (!conversationId) {
      socket.emit('error', { message: 'No active conversation' });
      return;
    }

    try {
      // Ensure conversation exists (create if not)
      const existingConv = await historyManager.getConversation(conversationId);
      if (!existingConv) {
        console.log(`[AIOS Chat] Creating conversation on-the-fly: ${conversationId}`);
        await historyManager.createConversation(conversationId, workingDirectory);
      }

      // Save user message
      await historyManager.addMessage(conversationId, {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      });

      socket.emit('message-received', { role: 'user', content: message });

      // Kill any existing process for this session
      if (currentProcess) {
        try {
          currentProcess.kill();
        } catch (e) {
          // Ignore kill errors
        }
        currentProcess = null;
      }

      // Use the root project directory instead of chat-ui
      const projectRoot = path.resolve(__dirname, '../../..');
      const cwd = workingDirectory || projectRoot;
      console.log(`[AIOS Chat] Executing claude in: ${cwd}`);
      console.log(`[AIOS Chat] Message: ${message.substring(0, 100)}...`);

      // Validate working directory exists
      const fs = await import('fs-extra');
      if (workingDirectory && !await fs.default.pathExists(cwd)) {
        console.error(`[AIOS Chat] Directory does not exist: ${cwd}`);
        socket.emit('response-error', {
          error: `Diretório não encontrado: "${cwd}"\n\nVerifique se o caminho está correto e tente novamente.`,
          conversationId
        });
        return;
      }

      console.log(`[AIOS Chat] Running claude with execa`);

      socket.emit('response-start', { conversationId });

      let fullResponse = '';

      try {
        // Use execa v5 which handles Windows .cmd files properly
        const execa = (await import('execa')).default;

        // Build the message with working directory context
        let contextualMessage = message;
        if (workingDirectory) {
          contextualMessage = `[Contexto: Você está trabalhando no diretório "${workingDirectory}". Use as ferramentas Read, Glob, Grep e Edit para analisar e modificar arquivos neste projeto.]\n\n${message}`;
        }

        // Use --dangerously-skip-permissions to allow file edits in non-interactive mode
        const result = await execa('claude', ['--print', '--output-format', 'text', '--dangerously-skip-permissions'], {
          cwd: cwd,
          input: contextualMessage,
          env: { ...process.env, FORCE_COLOR: '0' },
          timeout: 900000, // 15 minutes for complex operations
          reject: false // Don't throw on non-zero exit
        });

        // Log full result for debugging
        console.log(`[AIOS Chat] Claude result:`, {
          exitCode: result.exitCode,
          failed: result.failed,
          killed: result.killed,
          timedOut: result.timedOut,
          signal: result.signal,
          stdoutLength: result.stdout?.length || 0,
          stderrLength: result.stderr?.length || 0
        });

        if (result.stderr) {
          console.log(`[AIOS Chat] Claude stderr:`, result.stderr.substring(0, 500));
        }

        if (result.stdout) {
          fullResponse = result.stdout;
          socket.emit('response-chunk', {
            chunk: fullResponse,
            conversationId
          });
        }

        // Check for various failure conditions
        if ((result.failed || result.exitCode !== 0) && !fullResponse.trim()) {
          const errorMsg = result.stderr ||
                          (result.timedOut ? 'Operação excedeu o tempo limite (15 minutos). Tente dividir a tarefa em partes menores.' :
                           result.killed ? 'Processo foi terminado' :
                           `Claude exited with code ${result.exitCode || 'unknown'}`);
          throw new Error(errorMsg);
        }

        console.log(`[AIOS Chat] Got response (${fullResponse.length} chars): ${fullResponse.substring(0, 100)}...`);

      } catch (execError) {
        console.error(`[AIOS Chat] Exec error:`, execError.message || execError);
        if (!fullResponse.trim()) {
          socket.emit('response-error', {
            error: execError.message || 'Erro desconhecido ao executar Claude',
            conversationId
          });
        }
      }

      // Process completed
      console.log(`[AIOS Chat] Claude process completed`);
      currentProcess = null;
      activeSessions.delete(socket.id);

      if (fullResponse.trim()) {
        // Save assistant response
        await historyManager.addMessage(conversationId, {
          role: 'assistant',
          content: fullResponse.trim(),
          timestamp: new Date().toISOString()
        });
      }

      socket.emit('response-complete', {
        conversationId,
        exitCode: 0,
        response: fullResponse.trim()
      });

    } catch (error) {
      console.error('[AIOS Chat] Error sending message:', error);
      socket.emit('response-error', {
        error: error.message,
        conversationId
      });
    }
  });

  socket.on('cancel-request', () => {
    if (currentProcess) {
      try {
        currentProcess.kill('SIGTERM');
      } catch (e) {
        // Ignore
      }
      currentProcess = null;
      socket.emit('request-cancelled');
    }
  });

  socket.on('disconnect', () => {
    console.log(`[AIOS Chat] Client disconnected: ${socket.id}`);

    // Cleanup any running process
    const proc = activeSessions.get(socket.id);
    if (proc) {
      try {
        proc.kill();
      } catch (e) {
        // Ignore
      }
      activeSessions.delete(socket.id);
    }
  });
});

// Serve frontend in production
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3001;

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use!`);
    console.error(`   Try: netstat -ano | findstr :${PORT}`);
    console.error(`   Then: taskkill /PID <PID> /F\n`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
  }
});

// Handle uncaught exceptions to prevent crash
process.on('uncaughtException', (error) => {
  console.error('[AIOS Chat] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[AIOS Chat] Unhandled rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[AIOS Chat] Shutting down gracefully...');

  // Kill all active processes
  for (const [socketId, proc] of activeSessions) {
    try {
      proc.kill();
    } catch (e) {
      // Ignore
    }
  }

  server.close(() => {
    console.log('[AIOS Chat] Server closed.');
    process.exit(0);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🤖 AIOS Chat UI Server                                  ║
║                                                           ║
║   Server running on: http://localhost:${PORT}               ║
║   WebSocket ready for connections                         ║
║                                                           ║
║   Using Claude Code CLI as LLM backend                    ║
║                                                           ║
║   Press Ctrl+C to stop                                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export { app, server, io };
