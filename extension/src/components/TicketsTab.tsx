import { useState, useEffect } from 'react';
import { Ticket, Send, CheckCircle, Loader2, AlertTriangle, Clock, ExternalLink, Plus, History, Shield, Eye, ArrowUpRight } from 'lucide-react';

type TicketType = 'incident' | 'gcp_access' | 'bug' | 'change_request' | 'goalie_escalation' | 'general';

interface TicketTypeOption {
  value: TicketType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const TICKET_TYPES: TicketTypeOption[] = [
  { value: 'incident', label: 'Incident', description: 'Production issue', icon: <AlertTriangle size={14} />, color: 'from-red-500 to-rose-600' },
  { value: 'gcp_access', label: 'GCP Access', description: 'IAM request', icon: <Clock size={14} />, color: 'from-blue-500 to-indigo-600' },
  { value: 'goalie_escalation', label: 'Goalie', description: 'Escalation', icon: <Shield size={14} />, color: 'from-violet-500 to-purple-600' },
  { value: 'bug', label: 'Bug', description: 'Software defect', icon: <AlertTriangle size={14} />, color: 'from-amber-500 to-orange-600' },
  { value: 'change_request', label: 'Change Req', description: 'Infra change', icon: <Clock size={14} />, color: 'from-teal-500 to-cyan-600' },
  { value: 'general', label: 'General', description: 'Other request', icon: <Ticket size={14} />, color: 'from-slate-500 to-gray-600' },
];

interface SubmittedTicket {
  ritm: string;
  title: string;
  type: string;
  priority: string;
  timestamp: Date;
  goalieQueue?: boolean;
}

// Mock Goalie Queue items
const MOCK_GOALIE_QUEUE = [
  { ritm: 'RITM3847291', title: 'State lock on zions-prod-01 blocking 3 pipelines', priority: 'critical', status: 'In Review', age: '25m', assignee: 'Goalie (On-call)' },
  { ritm: 'RITM3847288', title: 'IAM group "gcp-analytics-editors" not created but entitlements added', priority: 'high', status: 'Investigating', age: '1h', assignee: 'Goalie (On-call)' },
  { ritm: 'RITM3847285', title: 'PR #4521 needs cost center validation before approval', priority: 'medium', status: 'Pending', age: '2h', assignee: 'Unassigned' },
  { ritm: 'RITM3847280', title: 'Pipeline rerun needed — IAM resources not yet available', priority: 'medium', status: 'Queued', age: '3h', assignee: 'Unassigned' },
];

interface TicketsTabProps {
  prefill?: { title: string; description: string; type: string } | null;
}

export default function TicketsTab({ prefill }: TicketsTabProps) {
  const [title, setTitle] = useState(prefill?.title || '');
  const [description, setDescription] = useState(prefill?.description || '');
  const [ticketType, setTicketType] = useState<TicketType>(
    (prefill?.type as TicketType) || 'incident'
  );
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<SubmittedTicket | null>(null);
  const [recentTickets, setRecentTickets] = useState<SubmittedTicket[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [activeView, setActiveView] = useState<'create' | 'queue'>('create');

  // React to prefill changes (e.g., escalation from Chat tab)
  useEffect(() => {
    if (prefill) {
      setTitle(prefill.title);
      setDescription(prefill.description);
      setTicketType((prefill.type as TicketType) || 'goalie_escalation');
      setActiveView('create');
      setSubmitted(null);
    }
  }, [prefill]);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const isGoalie = ticketType === 'goalie_escalation';
    const ritm = `RITM${String(Math.floor(Math.random() * 9000000) + 1000000)}`;
    const ticket: SubmittedTicket = {
      ritm,
      title: title.trim(),
      type: TICKET_TYPES.find((t) => t.value === ticketType)?.label || ticketType,
      priority,
      timestamp: new Date(),
      goalieQueue: isGoalie,
    };

    setSubmitted(ticket);
    setRecentTickets((prev) => [ticket, ...prev]);
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTicketType('incident');
    setPriority('medium');
    setSubmitted(null);
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Review': return 'text-blue-600 bg-blue-50';
      case 'Investigating': return 'text-amber-600 bg-amber-50';
      case 'Pending': return 'text-slate-600 bg-slate-50';
      case 'Queued': return 'text-violet-600 bg-violet-50';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  // Success state
  if (submitted) {
    return (
      <div className="flex flex-col h-full overflow-y-auto bg-gradient-to-b from-slate-50 to-white">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center w-full max-w-sm animate-scaleIn">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg
              ${submitted.goalieQueue
                ? 'bg-gradient-to-br from-violet-400 to-purple-500 shadow-violet-200'
                : 'bg-gradient-to-br from-emerald-400 to-green-500 shadow-emerald-200'
              }`}
            >
              {submitted.goalieQueue
                ? <Shield size={36} className="text-white" />
                : <CheckCircle size={36} className="text-white" />
              }
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {submitted.goalieQueue ? 'Escalation Queued!' : 'Ticket Created!'}
            </h3>
            <p className="text-sm text-slate-500 mb-2">
              <span className="font-mono font-bold text-emerald-600">{submitted.ritm}</span>
            </p>
            {submitted.goalieQueue && (
              <p className="text-xs text-violet-600 bg-violet-50 border border-violet-200/60 rounded-lg px-3 py-2 mb-4 font-medium">
                This ticket has been added to the **Goalie Review Queue**. The on-call Goalie will review within the SLA.
              </p>
            )}

            <div className="bg-white rounded-xl border border-slate-200/60 p-4 mb-4 text-left shadow-sm">
              <div className="space-y-2.5">
                {[
                  { label: 'RITM', value: submitted.ritm, mono: true },
                  { label: 'Title', value: submitted.title },
                  { label: 'Type', value: submitted.type },
                  { label: 'Priority', value: submitted.priority, capitalize: true },
                  { label: 'Status', value: 'Open', status: true },
                  ...(submitted.goalieQueue ? [{ label: 'Queue', value: 'Goalie Review', status: false, mono: false, capitalize: false }] : []),
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{row.label}</span>
                    <span className={`text-xs font-medium text-right max-w-[60%] truncate
                      ${row.mono ? 'font-mono text-slate-700' : ''}
                      ${row.status ? 'text-emerald-600' : 'text-slate-600'}
                      ${row.capitalize ? 'capitalize' : ''}
                    `}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-slate-400 mb-4">
              A confirmation email has been sent to your inbox.
            </p>

            <div className="flex gap-2">
              <button onClick={resetForm}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm">
                <Plus size={14} />Create Another
              </button>
              <button onClick={() => window.open('https://zionsbank.service-now.com', '_blank')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-all">
                <ExternalLink size={12} />ServiceNow
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-200/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-sm">
              <Ticket size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">ServiceNow</h2>
              <p className="text-[10px] text-slate-400">Tickets & Goalie Queue</p>
            </div>
          </div>
          {recentTickets.length > 0 && (
            <button onClick={() => setShowRecent(!showRecent)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-slate-500 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
              <History size={10} />{recentTickets.length}
            </button>
          )}
        </div>

        {/* Tab toggle: Create / Goalie Queue */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setActiveView('create')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all
              ${activeView === 'create' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Plus size={12} />
            Create Ticket
          </button>
          <button
            onClick={() => setActiveView('queue')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all
              ${activeView === 'queue' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Eye size={12} />
            Goalie Queue
            <span className="bg-violet-100 text-violet-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              {MOCK_GOALIE_QUEUE.length}
            </span>
          </button>
        </div>

        {/* Recent tickets dropdown */}
        {showRecent && recentTickets.length > 0 && (
          <div className="mt-3 space-y-1.5 animate-fadeIn">
            {recentTickets.map((ticket) => (
              <div key={ticket.ritm} className={`flex items-center justify-between p-2 rounded-lg border
                ${ticket.goalieQueue
                  ? 'bg-violet-50 border-violet-200/60'
                  : 'bg-emerald-50 border-emerald-200/60'
                }`}>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-700">{ticket.ritm}</span>
                    {ticket.goalieQueue && (
                      <span className="text-[8px] font-bold bg-violet-200 text-violet-700 px-1 py-0.5 rounded">GOALIE</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 truncate max-w-[180px]">{ticket.title}</p>
                </div>
                <CheckCircle size={12} className={ticket.goalieQueue ? 'text-violet-500' : 'text-emerald-500'} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Goalie Queue View */}
      {activeView === 'queue' && (
        <div className="p-4 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Escalations</h3>
            <span className="text-[9px] text-slate-400">Updated just now</span>
          </div>

          {MOCK_GOALIE_QUEUE.map((item) => (
            <div key={item.ritm} className="bg-white border border-slate-200/60 rounded-xl p-3 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-slate-600">{item.ritm}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getPriorityBadge(item.priority)}`}>
                  {item.priority}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-700 mb-2">{item.title}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                  <span className="text-[9px] text-slate-400">{item.age} ago</span>
                </div>
                <span className="text-[9px] text-slate-500">{item.assignee}</span>
              </div>
            </div>
          ))}

          {/* Escalate from queue */}
          <button
            onClick={() => { setActiveView('create'); setTicketType('goalie_escalation'); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-sm shadow-violet-200"
          >
            <ArrowUpRight size={14} />
            New Goalie Escalation
          </button>
        </div>
      )}

      {/* Create Ticket View */}
      {activeView === 'create' && (
        <div className="p-4 space-y-4 animate-fadeIn">
          {/* Ticket Type */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {TICKET_TYPES.map((type) => (
                <button key={type.value} onClick={() => setTicketType(type.value)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all
                    ${ticketType === type.value ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-slate-200/60 bg-white hover:border-slate-300'}`}>
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center
                    ${ticketType === type.value ? 'shadow-sm' : 'opacity-60'}`}>
                    <span className="text-white">{type.icon}</span>
                  </div>
                  <span className={`text-[10px] font-semibold ${ticketType === type.value ? 'text-blue-700' : 'text-slate-500'}`}>
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Goalie info banner */}
          {ticketType === 'goalie_escalation' && (
            <div className="p-2.5 bg-violet-50 border border-violet-200/60 rounded-xl text-xs text-violet-700 animate-fadeIn">
              <div className="flex items-center gap-1.5 font-semibold mb-1">
                <Shield size={12} />
                Goalie Escalation
              </div>
              <p className="text-[11px]">This ticket will be routed to the Goalie review queue with priority handling. SLA: Critical (30min), High (2hr), Medium (4hr).</p>
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Priority</label>
            <div className="flex gap-1.5">
              {([
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' },
              ] as const).map((p) => (
                <button key={p.value} onClick={() => setPriority(p.value)}
                  className={`flex-1 py-2 rounded-xl border text-[10px] font-semibold transition-all
                    ${priority === p.value ? `border ${getPriorityBadge(p.value)}` : 'border-slate-200/60 text-slate-400 hover:border-slate-300'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Issue Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={ticketType === 'goalie_escalation'
                ? 'e.g., State lock blocking prod pipeline'
                : 'e.g., Need roles/editor on zions-dev-analytics'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-slate-400 transition-all" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder={ticketType === 'goalie_escalation'
                ? 'Describe the issue, affected pipelines, error messages, and urgency...'
                : 'Describe the issue, what you need, and any relevant context...'}
              rows={4}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-slate-400 resize-none transition-all" />
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={!title.trim() || !description.trim() || isSubmitting}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm
              ${ticketType === 'goalie_escalation'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-200'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-200'
              }`}>
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {ticketType === 'goalie_escalation' ? 'Escalating to Goalie...' : 'Submitting to ServiceNow...'}
              </>
            ) : (
              <>
                {ticketType === 'goalie_escalation' ? <ArrowUpRight size={16} /> : <Send size={16} />}
                {ticketType === 'goalie_escalation' ? 'Escalate to Goalie Queue' : 'Submit to ServiceNow'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
