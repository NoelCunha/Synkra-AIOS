import { useChatStore } from '@/stores/chatStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function Sidebar() {
  const {
    conversations,
    currentConversationId,
    createConversation,
    selectConversation,
    deleteConversation,
  } = useChatStore();

  const handleNewChat = () => {
    createConversation();
  };

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
  };

  const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta conversa?')) {
      deleteConversation(id);
    }
  };

  return (
    <aside className="w-72 border-r border-aios-border bg-aios-surface/30 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-aios-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aios-primary to-aios-accent flex items-center justify-center">
            <span className="text-xl">⚡</span>
          </div>
          <div>
            <h2 className="font-bold text-white">Synkra AIOS</h2>
            <p className="text-xs text-aios-muted">Claude Code Interface</p>
          </div>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                   bg-gradient-to-r from-aios-primary to-aios-secondary
                   hover:from-aios-primary/90 hover:to-aios-secondary/90
                   text-white font-medium transition-all duration-200
                   shadow-lg shadow-aios-primary/25 hover:shadow-aios-primary/40"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Conversa
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <h3 className="text-xs font-semibold text-aios-muted uppercase tracking-wider px-2 mb-2">
          Histórico
        </h3>

        {conversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm text-aios-muted">
              Nenhuma conversa ainda.
              <br />
              Comece uma nova conversa!
            </p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => handleSelectConversation(conv.id)}
              className={`group relative flex items-start gap-3 p-3 rounded-lg cursor-pointer
                        transition-all duration-150 ${
                          currentConversationId === conv.id
                            ? 'bg-aios-primary/20 border border-aios-primary/30'
                            : 'hover:bg-aios-dark/50 border border-transparent'
                        }`}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-aios-dark flex items-center justify-center">
                <svg className="w-4 h-4 text-aios-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {conv.title}
                </p>
                <p className="text-xs text-aios-muted mt-0.5">
                  {formatDistanceToNow(new Date(conv.updatedAt), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                  {' · '}
                  {conv.messageCount} msgs
                </p>
              </div>

              {/* Delete Button */}
              <button
                onClick={(e) => handleDeleteConversation(e, conv.id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100
                         p-1.5 rounded-lg hover:bg-red-500/20 text-aios-muted hover:text-red-400
                         transition-all duration-150"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-aios-border">
        <div className="text-xs text-aios-muted text-center">
          Powered by Claude Code CLI
        </div>
      </div>
    </aside>
  );
}
