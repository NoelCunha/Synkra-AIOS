import ReactMarkdown from 'react-markdown';
import { Message as MessageType } from '@/stores/chatStore';

interface MessageProps {
  message: MessageType;
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isUser
          ? 'bg-aios-surface'
          : 'bg-gradient-to-br from-aios-primary to-aios-accent'
      }`}>
        <span className="text-sm">{isUser ? '👤' : '🤖'}</span>
      </div>

      {/* Message Content */}
      <div className={`max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-aios-primary text-white rounded-tr-none'
            : 'bg-aios-surface border border-aios-border rounded-tl-none'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="markdown-content">
              {message.isStreaming && !message.content ? (
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ) : (
                <ReactMarkdown
                  components={{
                    code: ({ className, children, ...props }) => {
                      const isInline = !className;
                      if (isInline) {
                        return (
                          <code className="bg-aios-darker px-1.5 py-0.5 rounded text-aios-accent font-mono text-sm" {...props}>
                            {children}
                          </code>
                        );
                      }
                      return (
                        <div className="relative group">
                          <pre className="bg-aios-darker p-4 rounded-lg overflow-x-auto my-3">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                          <button
                            onClick={() => {
                              const text = String(children).replace(/\n$/, '');
                              navigator.clipboard.writeText(text);
                            }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100
                                     px-2 py-1 rounded bg-aios-surface text-xs text-aios-muted
                                     hover:text-white transition-all duration-150"
                          >
                            Copiar
                          </button>
                        </div>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <p className={`text-xs text-aios-muted mt-1 ${isUser ? 'text-right' : ''}`}>
          {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
          {message.isStreaming && (
            <span className="ml-2 text-aios-primary">● Digitando...</span>
          )}
        </p>
      </div>
    </div>
  );
}
