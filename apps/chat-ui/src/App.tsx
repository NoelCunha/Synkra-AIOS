import { useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { Sidebar } from '@/components/Sidebar';
import { ChatArea } from '@/components/ChatArea';
import { Header } from '@/components/Header';

function App() {
  const { connect, disconnect, loadConversations, isConnected } = useChatStore();

  useEffect(() => {
    connect();
    loadConversations();

    return () => {
      disconnect();
    };
  }, []);

  return (
    <div className="flex h-screen bg-aios-dark text-aios-text">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header />
        <ChatArea />
      </div>

      {/* Connection Status Indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
          isConnected
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          {isConnected ? 'Conectado' : 'Desconectado'}
        </div>
      </div>
    </div>
  );
}

export default App;
