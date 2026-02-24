import { useRef, useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { Message } from '@/components/Message';
import { ChatInput } from '@/components/ChatInput';

export function ChatArea() {
  const { messages, currentConversationId, isLoading } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {!currentConversationId && messages.length === 0 ? (
          <WelcomeScreen />
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}

            {/* Loading indicator when waiting for response */}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aios-primary to-aios-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">🤖</span>
                </div>
                <div className="bg-aios-surface rounded-2xl rounded-tl-none p-4">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <ChatInput />
    </div>
  );
}

function WelcomeScreen() {
  const { createConversation } = useChatStore();

  const suggestions = [
    {
      icon: '📝',
      title: 'Criar uma função',
      prompt: 'Crie uma função que valida emails em TypeScript'
    },
    {
      icon: '🐛',
      title: 'Debugar código',
      prompt: 'Ajude-me a encontrar e corrigir bugs no código'
    },
    {
      icon: '📖',
      title: 'Explicar código',
      prompt: 'Explique como funciona este trecho de código'
    },
    {
      icon: '🏗️',
      title: 'Arquitetura',
      prompt: 'Sugira uma arquitetura para um novo projeto'
    },
  ];

  const handleSuggestionClick = (prompt: string) => {
    createConversation();
    // Small delay to ensure conversation is created
    setTimeout(() => {
      const { sendMessage } = useChatStore.getState();
      sendMessage(prompt);
    }, 100);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-aios-primary to-aios-accent
                        flex items-center justify-center shadow-lg shadow-aios-primary/30 mb-4">
            <span className="text-4xl">🤖</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Bem-vindo ao AIOS Chat
          </h1>
          <p className="text-aios-muted">
            Interface visual para o Claude Code CLI.
            <br />
            Digite sua solicitação e deixe a IA trabalhar por você.
          </p>
        </div>

        {/* Suggestions */}
        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion.prompt)}
              className="flex items-center gap-3 p-4 rounded-xl bg-aios-surface/50 border border-aios-border
                       hover:bg-aios-surface hover:border-aios-primary/50 transition-all duration-200
                       text-left group"
            >
              <span className="text-2xl">{suggestion.icon}</span>
              <div>
                <p className="font-medium text-white text-sm group-hover:text-aios-primary transition-colors">
                  {suggestion.title}
                </p>
                <p className="text-xs text-aios-muted line-clamp-1">
                  {suggestion.prompt}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Features */}
        <div className="mt-12 flex items-center justify-center gap-8 text-sm text-aios-muted">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Streaming em tempo real
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Histórico persistente
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Claude Code CLI
          </div>
        </div>
      </div>
    </div>
  );
}
