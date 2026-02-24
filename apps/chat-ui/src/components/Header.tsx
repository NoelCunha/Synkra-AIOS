import { useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';

export function Header() {
  const { workingDirectory, setWorkingDirectory, currentConversationId } = useChatStore();
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Get folder path from first file's webkitRelativePath
    const firstFile = files[0];
    const relativePath = firstFile.webkitRelativePath;
    const folderName = relativePath.split('/')[0];

    // We need to get the actual system path - this requires user to paste or type it
    // Since browser security doesn't allow getting full system path, we'll prompt user
    const fullPath = prompt(
      `Pasta selecionada: "${folderName}"\n\nPor segurança do navegador, cole o caminho completo da pasta:`,
      `C:\\Users\\...\\${folderName}`
    );

    if (fullPath) {
      setWorkingDirectory(fullPath);
    }

    // Reset input
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  return (
    <header className="h-14 border-b border-aios-border bg-aios-surface/50 backdrop-blur-sm flex items-center justify-between px-6">
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

      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          AIOS Chat
        </h1>

        {currentConversationId && (
          <span className="text-xs text-aios-muted bg-aios-dark px-2 py-1 rounded">
            ID: {currentConversationId.slice(0, 8)}...
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-aios-muted">Diretório:</label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={workingDirectory}
              onChange={(e) => setWorkingDirectory(e.target.value)}
              placeholder="Cole o caminho da pasta aqui"
              className="bg-aios-dark border border-aios-border rounded-lg px-3 py-1.5 text-sm w-72 pr-10
                       focus:outline-none focus:border-aios-primary focus:ring-1 focus:ring-aios-primary
                       placeholder:text-aios-muted/50"
            />
            {workingDirectory && (
              <button
                onClick={() => setWorkingDirectory('')}
                className="absolute right-2 text-aios-muted hover:text-red-400 transition-colors"
                title="Limpar diretório"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {workingDirectory && (
          <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/30">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Pasta ativa
          </span>
        )}

        <a
          href="https://github.com/SynkraAI/aios-core"
          target="_blank"
          rel="noopener noreferrer"
          className="text-aios-muted hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        </a>
      </div>
    </header>
  );
}
