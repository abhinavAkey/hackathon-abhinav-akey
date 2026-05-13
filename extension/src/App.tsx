import { useState, useEffect } from 'react';
import { MessageCircle, GitPullRequest, Ticket, Zap, Wifi, WifiOff } from 'lucide-react';
import ChatTab from './components/ChatTab';
import ReviewTab from './components/ReviewTab';
import TicketsTab from './components/TicketsTab';
import ActionsTab from './components/ActionsTab';

type Tab = 'chat' | 'review' | 'tickets' | 'actions';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'chat', label: 'Chat', icon: <MessageCircle size={16} /> },
  { id: 'review', label: 'Review', icon: <GitPullRequest size={16} /> },
  { id: 'tickets', label: 'Tickets', icon: <Ticket size={16} /> },
  { id: 'actions', label: 'Actions', icon: <Zap size={16} /> },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [ticketPrefill, setTicketPrefill] = useState<{ title: string; description: string; type: string } | null>(null);

  // Check backend health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('http://localhost:8000/health', { signal: AbortSignal.timeout(3000) });
        setBackendStatus(res.ok ? 'online' : 'offline');
      } catch {
        setBackendStatus('offline');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle escalation from Chat -> Tickets
  const handleEscalate = (context: { title: string; description: string; type: string }) => {
    setTicketPrefill(context);
    // Don't auto-switch — the Chat tab shows the escalation confirmation inline
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#002D5F] via-[#003D7A] to-[#0057A8] text-white px-4 py-3 flex items-center gap-3 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} />

        <div className="relative flex items-center gap-3 flex-1">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-900/30 ring-2 ring-white/20">
            DK
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight tracking-tight">Zions DevKick</h1>
            <p className="text-[10px] text-blue-200 leading-tight font-medium">Developer Assistant</p>
          </div>
        </div>

        <div className="relative flex items-center gap-1.5 text-[10px] font-medium">
          {backendStatus === 'online' ? (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-400 status-online" />
              <Wifi size={10} className="text-emerald-300" />
            </>
          ) : backendStatus === 'offline' ? (
            <>
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <WifiOff size={10} className="text-amber-300" />
            </>
          ) : (
            <div className="w-2 h-2 rounded-full bg-blue-300 animate-pulse" />
          )}
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-slate-200/80 flex px-1 pt-1 gap-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold rounded-t-lg transition-all relative
              ${activeTab === tab.id
                ? 'text-blue-700 bg-gradient-to-b from-blue-50 to-white border-t-2 border-x border-blue-500 border-x-slate-200/60 -mb-px z-10'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
          >
            <span className={activeTab === tab.id ? 'text-blue-600' : ''}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full animate-fadeIn" key={activeTab}>
          {activeTab === 'chat' && <ChatTab onEscalate={handleEscalate} />}
          {activeTab === 'review' && <ReviewTab />}
          {activeTab === 'tickets' && <TicketsTab prefill={ticketPrefill} />}
          {activeTab === 'actions' && <ActionsTab />}
        </div>
      </main>
    </div>
  );
}
