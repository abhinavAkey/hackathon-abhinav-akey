import { useState } from 'react';
import { Zap, ExternalLink, GitBranch, CheckCircle, Loader2, Cloud, BookOpen, FileCode, Settings, Database, Shield, Layout, Rocket, Star, Bell, ChevronDown, ChevronUp, ClipboardList, AlertCircle, Globe, FolderCode, Users } from 'lucide-react';

interface QuickLink {
  label: string;
  url: string;
  icon: React.ReactNode;
  description: string;
  gradient: string;
  category: 'portal' | 'devops' | 'cloud' | 'docs';
}

const QUICK_LINKS: QuickLink[] = [
  // Cloud Portals
  { label: 'GCP Console', url: 'https://console.cloud.google.com', icon: <Cloud size={16} />, description: 'Google Cloud dashboard', gradient: 'from-blue-500 to-cyan-500', category: 'cloud' },
  { label: 'GCP IAM Admin', url: 'https://console.cloud.google.com/iam-admin', icon: <Shield size={16} />, description: 'IAM roles & permissions', gradient: 'from-amber-500 to-orange-600', category: 'cloud' },
  // DevOps
  { label: 'Azure DevOps', url: 'https://dev.azure.com/ZionsBancorp', icon: <Layout size={16} />, description: 'Pipelines, repos & boards', gradient: 'from-sky-500 to-blue-600', category: 'devops' },
  { label: 'ADO Templates', url: 'https://dev.azure.com/ZionsBancorp/CloudPlatform/_git/zions-ado-templates', icon: <FileCode size={16} />, description: 'Pipeline YAML templates', gradient: 'from-violet-500 to-purple-600', category: 'devops' },
  { label: 'Terraform Modules', url: 'https://dev.azure.com/ZionsBancorp/CloudPlatform/_git/terraform-gcp-modules', icon: <Database size={16} />, description: 'Shared GCP TF modules', gradient: 'from-purple-500 to-violet-600', category: 'devops' },
  { label: 'Use Case Template', url: 'https://dev.azure.com/ZionsBancorp/CloudPlatform/_git/zions-use-case-template', icon: <FolderCode size={16} />, description: 'Standard use case repo template', gradient: 'from-teal-500 to-emerald-600', category: 'devops' },
  // Portals & Docs
  { label: 'Dev Portal', url: 'https://dev.azure.com/ZionsBancorp/CloudPlatform/_wiki', icon: <Globe size={16} />, description: 'Developer portal & onboarding', gradient: 'from-indigo-500 to-blue-600', category: 'portal' },
  { label: 'Cloud Portal', url: 'https://console.cloud.google.com/home/dashboard', icon: <Cloud size={16} />, description: 'GCP project overview', gradient: 'from-cyan-500 to-blue-500', category: 'portal' },
  { label: 'Confluence', url: 'https://zionsbank.atlassian.net/wiki', icon: <BookOpen size={16} />, description: 'Docs & runbooks', gradient: 'from-blue-600 to-indigo-600', category: 'docs' },
  { label: 'ServiceNow', url: 'https://zionsbank.service-now.com', icon: <Settings size={16} />, description: 'IT service portal', gradient: 'from-emerald-500 to-green-600', category: 'docs' },
  { label: 'Security Standards', url: 'https://zionsbank.atlassian.net/wiki/spaces/SEC/overview', icon: <Shield size={16} />, description: 'Compliance & security docs', gradient: 'from-red-500 to-rose-600', category: 'docs' },
  { label: 'ADO Boards', url: 'https://dev.azure.com/ZionsBancorp/CloudPlatform/_boards', icon: <Users size={16} />, description: 'Work items & sprints', gradient: 'from-pink-500 to-rose-600', category: 'devops' },
];

const TEMPLATES = [
  { name: 'GCP Microservice (Go)', repo: 'zions-template-go-microservice', icon: '🔵' },
  { name: 'GCP Microservice (Python)', repo: 'zions-template-python-microservice', icon: '🐍' },
  { name: 'Terraform GCP Module', repo: 'zions-template-terraform-module', icon: '🏗️' },
  { name: 'React Frontend App', repo: 'zions-template-react-app', icon: '⚛️' },
];

// Notifications / Reminders
const NOTIFICATIONS = [
  { type: 'warning' as const, message: 'Sprint Planning due tomorrow (Mon 9AM)', time: '1d' },
  { type: 'info' as const, message: 'Code freeze for Q2 release starts Wed', time: '3d' },
  { type: 'info' as const, message: 'Security training due by end of month', time: '20d' },
];

// Developer Standards
const DEV_STANDARDS = [
  {
    category: 'PR Standards',
    items: [
      'PR title must follow: [ADO Work Item ID] Short description',
      'Link PR to ADO work item (User Story / Task / Bug)',
      'PR must have at least 1 reviewer from your team',
      'All Checkov/tflint scans must pass before merge',
      'PR description must include: What, Why, Testing, and Rollback plan',
      'Max PR size: 400 lines changed (split larger PRs)',
    ],
  },
  {
    category: 'Story Definition of Done',
    items: [
      'Code reviewed and approved by at least 1 peer',
      'Unit tests written with >80% code coverage',
      'Integration tests pass in ADO CI/CD pipeline',
      'Documentation updated (README, Confluence, or ADR)',
      'No open CRITICAL/HIGH security findings',
      'ADO work item moved to "Done" with acceptance criteria met',
      'Deployed to staging and smoke-tested',
    ],
  },
  {
    category: 'Use Case Pipeline Standards',
    items: [
      'Clone from zions-use-case-template for new use cases',
      'Follow folder structure: infra/, src/, tests/, docs/',
      'Pipeline YAML must reference zions-ado-templates',
      'Include Terraform plan output in PR for infra changes',
      'GCP project must be provisioned via use case onboarding form',
      'Cost center and billing labels required on all GCP resources',
    ],
  },
  {
    category: 'ADO Pipeline Standards',
    items: [
      'Use approved templates from zions-ado-templates repo',
      'All pipelines must include: lint, test, security scan, deploy stages',
      'Production deploys require 2 approvals (tech lead + platform)',
      'Rollback plan documented in pipeline YAML comments',
      'Secrets must come from Azure Key Vault or GCP Secret Manager',
      'Variable groups for environment-specific configs',
    ],
  },
  {
    category: 'Terraform / GCP Standards',
    items: [
      'Use shared modules from terraform-gcp-modules repo',
      'State stored in GCS with CMEK encryption',
      'Provider versions pinned to exact versions',
      'No hardcoded secrets — use variables with sensitive=true',
      'Follow naming: zions-{env}-{service}-{resource}',
      'All GCP resources must have environment, team, and cost_center labels',
    ],
  },
  {
    category: 'GCP Security Checklist',
    items: [
      'No public IPs on compute instances (use Cloud NAT)',
      'No 0.0.0.0/0 ingress firewall rules',
      'CMEK encryption for all GCP storage resources',
      'VPC Flow Logs enabled on all subnets',
      'Container images from approved Artifact Registry only',
      'No root containers — use USER nonroot in Dockerfiles',
      'Service accounts: no downloaded keys, use Workload Identity',
    ],
  },
];

export default function ActionsTab() {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [repoName, setRepoName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [created, setCreated] = useState<{ name: string; url: string } | null>(null);
  const [expandedStandard, setExpandedStandard] = useState<string | null>(null);
  const [dismissedNotifs, setDismissedNotifs] = useState<number[]>([]);

  const openLink = (url: string) => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank');
    }
  };

  const handleCreateRepo = async () => {
    if (!selectedTemplate || !repoName.trim()) return;
    setIsCreating(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setCreated({
      name: repoName.trim(),
      url: `https://dev.azure.com/ZionsBancorp/CloudPlatform/_git/${repoName.trim()}`,
    });
    setIsCreating(false);
  };

  const activeNotifs = NOTIFICATIONS.filter((_, i) => !dismissedNotifs.includes(i));

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-200/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Quick Actions</h2>
            <p className="text-[10px] text-slate-400">Links, standards, and bootstrapping</p>
          </div>
        </div>
      </div>

      {/* Notifications / Reminders */}
      {activeNotifs.length > 0 && (
        <div className="px-4 pt-3 space-y-1.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Bell size={10} className="text-amber-500" />
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reminders</h3>
          </div>
          {NOTIFICATIONS.map((notif, i) =>
            dismissedNotifs.includes(i) ? null : (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs animate-fadeIn
                  ${notif.type === 'warning' ? 'bg-amber-50 border-amber-200/60 text-amber-800' : 'bg-blue-50 border-blue-200/60 text-blue-800'}`}
              >
                <AlertCircle size={12} className={notif.type === 'warning' ? 'text-amber-500' : 'text-blue-500'} />
                <span className="flex-1 font-medium">{notif.message}</span>
                <span className="text-[9px] text-slate-400 font-mono">{notif.time}</span>
                <button onClick={() => setDismissedNotifs(p => [...p, i])} className="text-slate-400 hover:text-slate-600 ml-1">
                  ×
                </button>
              </div>
            )
          )}
        </div>
      )}

      {/* Quick Links by Category */}
      {(['portal', 'cloud', 'devops', 'docs'] as const).map((cat) => {
        const links = QUICK_LINKS.filter((l) => l.category === cat);
        if (links.length === 0) return null;
        const catLabels = { portal: 'Portals', cloud: 'GCP Cloud', devops: 'Azure DevOps', docs: 'Docs & Services' };
        const catIcons = { portal: <Globe size={10} />, cloud: <Cloud size={10} />, devops: <Layout size={10} />, docs: <BookOpen size={10} /> };
        return (
          <div key={cat} className="px-4 pt-3">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-slate-400">{catIcons[cat]}</span>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{catLabels[cat]}</h3>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {links.map((link) => (
                <button
                  key={link.label}
                  onClick={() => openLink(link.url)}
                  className="flex items-start gap-2 p-2.5 bg-white border border-slate-200/60 rounded-xl hover:border-blue-200 hover:shadow-md transition-all text-left group"
                >
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${link.gradient} flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <span className="text-white">{link.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-semibold text-slate-700 group-hover:text-blue-600 truncate transition-colors">
                        {link.label}
                      </span>
                      <ExternalLink size={7} className="text-slate-300 flex-shrink-0" />
                    </div>
                    <p className="text-[8px] text-slate-400 leading-tight mt-0.5 truncate">{link.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Developer Standards */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-1.5 mb-2.5">
          <ClipboardList size={10} className="text-indigo-500" />
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Developer Standards</h3>
        </div>
        <div className="space-y-1.5">
          {DEV_STANDARDS.map((standard) => (
            <div key={standard.category} className="bg-white border border-slate-200/60 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedStandard(expandedStandard === standard.category ? null : standard.category)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span>{standard.category}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                    {standard.items.length}
                  </span>
                  {expandedStandard === standard.category ? (
                    <ChevronUp size={12} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={12} className="text-slate-400" />
                  )}
                </div>
              </button>
              {expandedStandard === standard.category && (
                <div className="px-3 pb-3 border-t border-slate-100 animate-fadeIn">
                  <ul className="mt-2 space-y-1.5">
                    {standard.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-slate-600">
                        <CheckCircle size={11} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Repo Bootstrap */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Rocket size={10} className="text-violet-500" />
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Repo Bootstrap</h3>
        </div>
        <div className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm space-y-3">
          {created ? (
            <div className="text-center py-2 animate-scaleIn">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-200">
                <CheckCircle size={24} className="text-white" />
              </div>
              <p className="text-sm font-bold text-slate-800">Repository Created!</p>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">{created.name}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => openLink(created.url)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-sm">
                  <ExternalLink size={12} />Open in ADO
                </button>
                <button onClick={() => { setCreated(null); setRepoName(''); setSelectedTemplate(''); }} className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200">Create Another</button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500">Scaffold from an approved Zions template.</p>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Template</label>
                <div className="space-y-1.5">
                  {TEMPLATES.map((t) => (
                    <button key={t.repo} onClick={() => setSelectedTemplate(t.repo)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left text-xs transition-all
                        ${selectedTemplate === t.repo ? 'border-blue-300 bg-blue-50 text-blue-700 font-medium' : 'border-slate-200/60 text-slate-600 hover:border-slate-300'}`}>
                      <span>{t.icon}</span>{t.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Repository Name</label>
                <input type="text" value={repoName} onChange={(e) => setRepoName(e.target.value)} placeholder="e.g., my-new-service"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-slate-400 transition-all" />
              </div>
              <button onClick={handleCreateRepo} disabled={!selectedTemplate || !repoName.trim() || isCreating}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold hover:from-violet-700 hover:to-purple-700 disabled:opacity-40 transition-all shadow-sm">
                {isCreating ? (<><Loader2 size={14} className="animate-spin" />Creating...</>) : (<><GitBranch size={14} />Create from Template</>)}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
