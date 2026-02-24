import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';

export function ChatInput() {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, cancelRequest, isLoading, isConnected, workingDirectory, setWorkingDirectory } = useChatStore();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!input.trim() || isLoading || !isConnected) return;

    sendMessage(input);
    setInput('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCancel = () => {
    cancelRequest();
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Get folder name from first file
    const firstFile = files[0];
    const folderName = firstFile.webkitRelativePath.split('/')[0];

    // Prompt user for full path since browser security doesn't allow getting it
    const fullPath = prompt(
      `Pasta selecionada: "${folderName}"\n\n` +
      `Por segurança do navegador, cole o caminho COMPLETO da pasta.\n\n` +
      `Exemplo: C:\\Users\\Noel\\Desktop\\${folderName}\n\n` +
      `Dica: No Windows Explorer, clique na barra de endereço e copie o caminho.`
    );

    if (fullPath && fullPath.trim()) {
      const path = fullPath.trim();

      // Validate path doesn't contain placeholder
      if (path.includes('...')) {
        alert('Caminho inválido! Por favor, cole o caminho completo da pasta sem "..."');
        return;
      }

      // Basic validation for Windows/Unix path
      if (!path.match(/^[A-Za-z]:\\|^\/|^~/)) {
        alert('Caminho inválido! O caminho deve começar com uma letra de unidade (ex: C:\\) ou / para Unix.');
        return;
      }

      setWorkingDirectory(path);
    }

    // Reset input
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  return (
    <div className="border-t border-aios-border bg-aios-surface/50 backdrop-blur-sm p-4">
      {/* Hidden folder input */}
      <input
        ref={folderInputRef}
        type="file"
        /* @ts-expect-error webkitdirectory is not in the standard types */
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFolderSelect}
        className="hidden"
      />

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        {/* Working directory indicator */}
        {workingDirectory && (
          <div className="mb-3 p-3 bg-aios-dark border border-green-500/50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="text-aios-text font-medium text-sm truncate max-w-md" title={workingDirectory}>
                  {workingDirectory}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setWorkingDirectory('')}
                className="p-1 text-aios-muted hover:text-red-400 transition-colors"
                title="Remover diretório"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-green-400/70 mt-1">
              Claude pode ler e editar arquivos nesta pasta
            </p>
          </div>
        )}

        <div className="relative flex items-end gap-3">
          {/* Folder button */}
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            disabled={!isConnected || isLoading}
            className={`p-3 rounded-xl border transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     ${workingDirectory
                       ? 'bg-green-500/10 border-green-500/50 text-green-400 hover:bg-green-500/20'
                       : 'bg-aios-dark border-aios-border text-aios-muted hover:text-aios-primary hover:border-aios-primary/50'
                     }`}
            title={workingDirectory ? `Pasta: ${workingDirectory}` : 'Selecionar pasta de trabalho'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </button>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={workingDirectory
                ? `Peça para analisar ou modificar arquivos em ${workingDirectory.split('\\').pop() || workingDirectory.split('/').pop()}...`
                : isConnected
                  ? "Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
                  : "Aguardando conexão..."}
              disabled={!isConnected}
              rows={1}
              className="w-full bg-aios-dark border border-aios-border rounded-xl px-4 py-3 pr-12
                       text-aios-text placeholder:text-aios-muted/50 resize-none
                       focus:outline-none focus:border-aios-primary focus:ring-1 focus:ring-aios-primary
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
            />

            {/* Character count */}
            {input.length > 0 && (
              <span className="absolute bottom-2 right-3 text-xs text-aios-muted">
                {input.length}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {isLoading ? (
              <button
                type="button"
                onClick={handleCancel}
                className="p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30
                         border border-red-500/30 transition-all duration-200"
                title="Cancelar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || !isConnected}
                className="p-3 rounded-xl bg-gradient-to-r from-aios-primary to-aios-secondary
                         text-white disabled:opacity-50 disabled:cursor-not-allowed
                         hover:from-aios-primary/90 hover:to-aios-secondary/90
                         shadow-lg shadow-aios-primary/25 hover:shadow-aios-primary/40
                         transition-all duration-200"
                title="Enviar mensagem"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Helper text */}
        <div className="flex items-center justify-between mt-2 px-1">
          <p className="text-xs text-aios-muted">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-aios-primary animate-pulse" />
                Processando via Claude Code CLI...
              </span>
            ) : (
              <>
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Selecione uma pasta
                {' · '}
                <kbd className="px-1.5 py-0.5 rounded bg-aios-dark text-aios-muted">Enter</kbd> enviar
                {' · '}
                <kbd className="px-1.5 py-0.5 rounded bg-aios-dark text-aios-muted">Shift+Enter</kbd> nova linha
              </>
            )}
          </p>

          <p className="text-xs text-aios-muted">
            Claude Code CLI
          </p>
        </div>
      </form>
    </div>
  );
}
