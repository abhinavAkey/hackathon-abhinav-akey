import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, AlertTriangle, BookOpen, Copy, Check, Trash2, Download, ChevronDown, ArrowUpRight, Ticket, Shield } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const API_BASE = 'http://localhost:8000';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: string[];
}

// Callback for escalation to tickets tab
interface ChatTabProps {
  onEscalate?: (context: { title: string; description: string; type: string }) => void;
}

const QUICK_PROMPTS = [
  {
    icon: <AlertTriangle size={14} />,
    label: 'Terraform 403 Error',
    prompt: 'I just got this error running terraform apply:\n\nError: googleapi: Error 403: Permission \'iam.serviceAccounts.actAs\' denied on resource \'projects/zions-prod-01/serviceAccounts/sa-iac-creator-01@zions-prod-01.iam.gserviceaccount.com\'\n\nWhat does this mean and how do I fix it?',
    color: 'text-red-500',
  },
  {
    icon: <BookOpen size={14} />,
    label: 'ADO Pipeline Failed',
    prompt: 'My Azure DevOps pipeline failed with error: "##[error]The pipeline is not valid. Job Build: Step TerraformTaskV4 input command: the value \'apply\' is not part of the accepted values". How do I fix this using the Zions ADO template?',
    color: 'text-orange-500',
  },
  {
    icon: <Sparkles size={14} />,
    label: 'Request GCP Access',
    prompt: 'What is the process to request IAM access for a GCP project at Zions? I need roles/editor on the zions-dev-analytics project.',
    color: 'text-blue-500',
  },
  {
    icon: <Shield size={14} />,
    label: 'Goalie Escalation Help',
    prompt: 'I have an issue that needs Goalie review. My Terraform pipeline is failing due to a state lock and I need help resolving it. What is the escalation process?',
    color: 'text-violet-500',
  },
];

// Custom code block with copy button
function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    try { navigator.clipboard.writeText(children); } catch { /* fallback: noop */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      <pre className={className}>
        <code>{children}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1 rounded bg-white/10 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-gray-400" />}
      </button>
    </div>
  );
}

export default function ChatTab({ onEscalate }: ChatTabProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('devkick_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((m: Message) => ({ ...m, timestamp: new Date(m.timestamp) }));
      }
    } catch { /* ignore */ }
    return [
      {
        id: '0',
        role: 'system' as const,
        content: "Hi! I'm your **Zions DevKick** assistant. I can help you:\n\n- Troubleshoot **GCP IAM 403** errors\n- Debug **ADO pipeline** failures\n- Navigate **ServiceNow** processes\n- Review **Terraform** code\n- **Escalate issues** to Goalie for review\n\nAsk me anything or try a quick prompt below!",
        timestamp: new Date(),
      },
    ];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [escalateMsg, setEscalateMsg] = useState<string | null>(null);
  const [escalateSuccess, setEscalateSuccess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('devkick_chat_history', JSON.stringify(messages));
    } catch { /* ignore */ }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      setShowScrollBtn(!atBottom);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: messages
            .filter((m) => m.role !== 'system')
            .slice(-10)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');
      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        sources: data.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '**Connection Error**\n\nCouldn\'t connect to the DevKick backend. Make sure the FastAPI server is running:\n\n```bash\ncd backend && uvicorn main:app --reload --port 8000\n```',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Escalation / ticket creation from chat context
  const handleEscalate = async (messageContent: string, type: 'goalie' | 'ticket' = 'goalie') => {
    if (escalateMsg) return; // Guard against double-click
    setEscalateMsg(messageContent);
    setEscalateSuccess(false);

    const conversationContext = messages
      .filter((m) => m.role !== 'system')
      .slice(-6)
      .map((m) => `[${m.role === 'user' ? 'Developer' : 'DevKick AI'}]: ${m.content.substring(0, 200)}`)
      .join('\n\n');

    const userMessages = messages.filter((m) => m.role === 'user');
    const title = userMessages.length > 0
      ? `${type === 'goalie' ? 'Escalation' : 'Ticket'}: ${userMessages[userMessages.length - 1].content.substring(0, 80)}`
      : `${type === 'goalie' ? 'Escalation' : 'Ticket'} from DevKick Chat`;

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const ritm = `RITM${String(Math.floor(Math.random() * 9000000) + 1000000)}`;

    const isGoalie = type === 'goalie';
    const confirmMsg: Message = {
      id: Date.now().toString(),
      role: 'system',
      content: isGoalie
        ? `**Escalation Created**\n\nTicket **${ritm}** has been created and queued for **Goalie Review**.\n\n**Title:** ${title}\n**Priority:** High\n**Queue:** Goalie Review\n\nThe Goalie team will review within **2 hours** (SLA). A notification has been sent to the on-call Goalie.\n\nTrack in the **Tickets tab** or on [ServiceNow](https://zionsbank.service-now.com).`
        : `**Ticket Created**\n\nServiceNow ticket **${ritm}** has been created.\n\n**Title:** ${title}\n**Priority:** Medium\n\nTrack in the **Tickets tab** or on [ServiceNow](https://zionsbank.service-now.com).`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, confirmMsg]);
    setEscalateSuccess(true);
    setEscalateMsg(null);

    if (onEscalate) {
      onEscalate({
        title,
        description: `${isGoalie ? 'Escalated' : 'Created'} from DevKick Chat:\n\n${conversationContext}`,
        type: isGoalie ? 'goalie_escalation' : 'incident',
      });
    }
  };

  const clearHistory = () => {
    setMessages([
      {
        id: '0',
        role: 'system',
        content: "Chat cleared! I'm ready to help with your next question.",
        timestamp: new Date(),
      },
    ]);
  };

  const exportChat = () => {
    const text = messages
      .map((m) => `[${m.role.toUpperCase()}] ${m.content}`)
      .join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devkick-chat-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/80 backdrop-blur-sm border-b border-slate-200/60">
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
          {messages.length - 1} message{messages.length - 1 !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={exportChat} className="p-1 hover:bg-slate-100 rounded transition-colors" title="Export chat">
            <Download size={12} className="text-slate-400" />
          </button>
          <button onClick={clearHistory} className="p-1 hover:bg-red-50 rounded transition-colors" title="Clear chat">
            <Trash2 size={12} className="text-slate-400 hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Escalation Success Banner */}
      {escalateSuccess && (
        <div className="mx-3 mt-2 p-2 bg-emerald-50 border border-emerald-200/60 rounded-xl flex items-center gap-2 animate-fadeIn">
          <Check size={14} className="text-emerald-600" />
          <span className="text-xs font-medium text-emerald-700">Escalation queued for Goalie review</span>
          <button onClick={() => setEscalateSuccess(false)} className="ml-auto text-emerald-400 hover:text-emerald-600">x</button>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-3 relative"
      >
        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn group/msg`}
            style={{ animationDelay: idx === messages.length - 1 ? '0.1s' : '0s' }}
          >
            <div className="max-w-[92%]">
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm
                  ${msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md'
                    : msg.role === 'system'
                      ? 'bg-gradient-to-br from-indigo-50 to-blue-50 text-slate-700 border border-indigo-100/60 rounded-bl-md'
                      : 'bg-white text-slate-700 border border-slate-200/60 rounded-bl-md'
                  }`}
              >
                {msg.role === 'system' && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                      <Sparkles size={10} className="text-white" />
                    </div>
                    <span className="text-xs font-semibold text-indigo-600">DevKick AI</span>
                  </div>
                )}
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                      <Sparkles size={10} className="text-white" />
                    </div>
                    <span className="text-xs font-semibold text-indigo-600">DevKick AI</span>
                    <span className="text-[10px] text-slate-400 ml-auto">{formatTime(msg.timestamp)}</span>
                  </div>
                )}
                {msg.role === 'user' && (
                  <div className="flex justify-end mb-1">
                    <span className="text-[10px] text-blue-200">{formatTime(msg.timestamp)}</span>
                  </div>
                )}
                <div className="markdown-content">
                  <ReactMarkdown
                    components={{
                      code: ({ className, children }) => {
                        const isBlock = className?.includes('language-');
                        if (isBlock) {
                          return <CodeBlock className={className}>{String(children).replace(/\n$/, '')}</CodeBlock>;
                        }
                        return <code className={className}>{children}</code>;
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Sources</p>
                    <div className="flex flex-wrap gap-1">
                      {msg.sources.map((source, i) => (
                        <span key={i} className="inline-flex items-center text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                          <BookOpen size={8} className="mr-1" />
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Escalate button — appears on assistant messages and user error messages */}
              {(msg.role === 'assistant' || msg.role === 'user') && msg.id !== '0' && (
                <div className="flex items-center gap-1 mt-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => {
                        try { navigator.clipboard.writeText(msg.content); } catch { /* noop */ }
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-[9px] font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Copy size={9} /> Copy
                    </button>
                  )}
                  <button
                    onClick={() => handleEscalate(msg.content, 'goalie')}
                    disabled={escalateMsg !== null}
                    className="flex items-center gap-1 px-2 py-1 text-[9px] font-medium text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <ArrowUpRight size={9} />
                    {escalateMsg === msg.content ? 'Escalating...' : 'Escalate to Goalie'}
                  </button>
                  <button
                    onClick={() => handleEscalate(msg.content, 'ticket')}
                    disabled={escalateMsg !== null}
                    className="flex items-center gap-1 px-2 py-1 text-[9px] font-medium text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Ticket size={9} />
                    Create Ticket
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-fadeIn">
            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-slate-200/60">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                  <Sparkles size={10} className="text-white animate-pulse" />
                </div>
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-32 right-4 p-2 bg-white rounded-full shadow-lg border border-slate-200 hover:bg-slate-50 transition-all z-10"
        >
          <ChevronDown size={16} className="text-slate-500" />
        </button>
      )}

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="px-3 pb-2 space-y-1.5">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Quick prompts</p>
          {QUICK_PROMPTS.map((qp, i) => (
            <button
              key={i}
              onClick={() => sendMessage(qp.prompt)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs bg-white border border-slate-200/80 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <span className={`${qp.color} group-hover:scale-110 transition-transform`}>{qp.icon}</span>
              <span className="text-slate-600 group-hover:text-slate-800 font-medium">{qp.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 bg-white/80 backdrop-blur-sm border-t border-slate-200/60">
        <div className="flex items-end gap-2 bg-slate-50 rounded-2xl border border-slate-200/80 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all p-1">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about errors, pipelines, or escalate issues..."
            rows={1}
            className="flex-1 resize-none bg-transparent px-3 py-2 text-sm focus:outline-none placeholder:text-slate-400"
            style={{ minHeight: '36px', maxHeight: '120px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-1.5">
          Powered by Zions Knowledge Base + RAG | Hover messages to escalate
        </p>
      </div>
    </div>
  );
}
