import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

interface ChatState {
  // Connection
  socket: Socket | null;
  isConnected: boolean;

  // Conversations
  conversations: Conversation[];
  currentConversationId: string | null;

  // Messages
  messages: Message[];
  isLoading: boolean;
  streamingContent: string;

  // Settings
  workingDirectory: string;

  // Actions
  connect: () => void;
  disconnect: () => void;

  loadConversations: () => Promise<void>;
  createConversation: () => void;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;

  sendMessage: (content: string) => void;
  cancelRequest: () => void;
  clearMessages: () => void;

  setWorkingDirectory: (dir: string) => void;
}

const SOCKET_URL = import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin;

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  socket: null,
  isConnected: false,
  conversations: [],
  currentConversationId: null,
  messages: [],
  isLoading: false,
  streamingContent: '',
  workingDirectory: '',

  connect: () => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[AIOS Chat] Connected to server');
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      console.log('[AIOS Chat] Disconnected from server');
      set({ isConnected: false });
    });

    socket.on('conversation-started', ({ conversationId }) => {
      set({ currentConversationId: conversationId });
    });

    socket.on('message-received', ({ role, content }) => {
      // Only add assistant/system messages - user messages are added locally in sendMessage
      if (role !== 'user') {
        const message: Message = {
          id: uuidv4(),
          role,
          content,
          timestamp: new Date().toISOString(),
        };
        set(state => ({
          messages: [...state.messages, message],
        }));
      }
    });

    socket.on('response-start', () => {
      set({ isLoading: true, streamingContent: '' });

      // Add placeholder streaming message
      const streamingMessage: Message = {
        id: 'streaming',
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        isStreaming: true,
      };
      set(state => ({
        messages: [...state.messages, streamingMessage],
      }));
    });

    socket.on('response-chunk', ({ chunk }) => {
      set(state => {
        const newContent = state.streamingContent + chunk;

        // Update the streaming message
        const updatedMessages = state.messages.map(msg =>
          msg.id === 'streaming'
            ? { ...msg, content: newContent }
            : msg
        );

        return {
          streamingContent: newContent,
          messages: updatedMessages,
        };
      });
    });

    socket.on('response-complete', ({ response }) => {
      set(state => {
        // Finalize the streaming message
        const updatedMessages = state.messages.map(msg =>
          msg.id === 'streaming'
            ? { ...msg, id: uuidv4(), content: response, isStreaming: false }
            : msg
        );

        return {
          isLoading: false,
          streamingContent: '',
          messages: updatedMessages,
        };
      });

      // Refresh conversation list
      get().loadConversations();
    });

    socket.on('response-error', ({ error }) => {
      console.error('[AIOS Chat] Error:', error);

      const errorMessage: Message = {
        id: uuidv4(),
        role: 'system',
        content: `Erro: ${error}`,
        timestamp: new Date().toISOString(),
      };

      set(state => ({
        isLoading: false,
        streamingContent: '',
        messages: [...state.messages.filter(m => m.id !== 'streaming'), errorMessage],
      }));
    });

    socket.on('request-cancelled', () => {
      set(state => ({
        isLoading: false,
        streamingContent: '',
        messages: state.messages.filter(m => m.id !== 'streaming'),
      }));
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  loadConversations: async () => {
    try {
      const response = await fetch('/api/conversations');
      const conversations = await response.json();
      set({ conversations });
    } catch (error) {
      console.error('[AIOS Chat] Failed to load conversations:', error);
    }
  },

  createConversation: () => {
    const { socket, workingDirectory } = get();
    const conversationId = uuidv4();

    if (socket) {
      socket.emit('start-conversation', {
        conversationId,
        workingDirectory,
      });
    }

    set({
      currentConversationId: conversationId,
      messages: [],
      streamingContent: '',
    });
  },

  selectConversation: async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`);
      const conversation = await response.json();

      const { socket, workingDirectory } = get();

      if (socket) {
        socket.emit('start-conversation', {
          conversationId: id,
          workingDirectory: conversation.workingDirectory || workingDirectory,
        });
      }

      set({
        currentConversationId: id,
        messages: conversation.messages || [],
        workingDirectory: conversation.workingDirectory || workingDirectory,
      });
    } catch (error) {
      console.error('[AIOS Chat] Failed to load conversation:', error);
    }
  },

  deleteConversation: async (id: string) => {
    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' });

      const { currentConversationId } = get();

      if (currentConversationId === id) {
        set({
          currentConversationId: null,
          messages: [],
        });
      }

      await get().loadConversations();
    } catch (error) {
      console.error('[AIOS Chat] Failed to delete conversation:', error);
    }
  },

  sendMessage: (content: string) => {
    const { socket, currentConversationId, workingDirectory } = get();

    if (!socket || !content.trim()) return;

    const trimmedContent = content.trim();

    // Add user message immediately to local state for instant feedback
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: trimmedContent,
      timestamp: new Date().toISOString(),
    };

    // Create conversation if needed
    let convId = currentConversationId;
    if (!convId) {
      convId = uuidv4();
      set({
        currentConversationId: convId,
        messages: [userMessage], // Add user message to new conversation
      });

      // Emit start-conversation and wait a bit for server to create it
      socket.emit('start-conversation', {
        conversationId: convId,
        workingDirectory,
      });

      // Small delay to ensure conversation is created on server
      setTimeout(() => {
        socket.emit('send-message', {
          message: trimmedContent,
          conversationId: convId,
          workingDirectory,
        });
      }, 100);
    } else {
      // Add user message to existing conversation
      set(state => ({
        messages: [...state.messages, userMessage],
      }));

      socket.emit('send-message', {
        message: trimmedContent,
        conversationId: convId,
        workingDirectory,
      });
    }
  },

  cancelRequest: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('cancel-request');
    }
  },

  clearMessages: () => {
    set({ messages: [], streamingContent: '' });
  },

  setWorkingDirectory: (dir: string) => {
    set({ workingDirectory: dir });
  },
}));
