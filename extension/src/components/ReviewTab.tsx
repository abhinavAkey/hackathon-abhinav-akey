import { useState } from 'react';
import { GitPullRequest, Play, AlertCircle, CheckCircle, XCircle, Info, ExternalLink, RefreshCw, Shield, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const API_BASE = 'http://localhost:8000';

interface ReviewResult {
  summary: string;
  issues: { severity: 'critical' | 'warning' | 'info'; message: string; line?: string }[];
  score: number;
  recommendation: string;
}

export default function ReviewTab() {
  const [currentUrl, setCurrentUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [rawReview, setRawReview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectedPR, setDetectedPR] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState(0);

  const detectCurrentPage = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) {
          setCurrentUrl(tab.url);
          const isPR = tab.url.includes('pullrequest') ||
                       tab.url.includes('/pull/') ||
                       tab.url.includes('_git') ||
                       tab.url.includes('github.com');
          setDetectedPR(isPR);
          return tab.url;
        }
      }
    } catch { /* not in extension context */ }
    const mockUrl = 'https://dev.azure.com/ZionsBancorp/CloudPlatform/_git/terraform-gcp-modules/pullrequest/4521';
    setCurrentUrl(mockUrl);
    setDetectedPR(true);
    return mockUrl;
  };

  const analyzeCurrentPR = async () => {
    setIsAnalyzing(true);
    setError(null);
    setReview(null);
    setRawReview(null);
    setShowRaw(false);
    setAnalyzeStep(0);

    const url = await detectCurrentPage();

    // Animate analysis steps
    const steps = [1, 2, 3, 4];
    for (const step of steps) {
      await new Promise(r => setTimeout(r, 600));
      setAnalyzeStep(step);
    }

    try {
      const response = await fetch(`${API_BASE}/api/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) throw new Error('Failed to get review');

      const data = await response.json();
      if (!data.structured || !data.raw_review) throw new Error('Invalid review response');
      setReview(data.structured);
      setRawReview(data.raw_review);
    } catch {
      setError('Could not connect to the backend. Make sure the FastAPI server is running on port 8000.');
    } finally {
      setIsAnalyzing(false);
      setAnalyzeStep(0);
    }
  };

  const copyReview = () => {
    if (rawReview) {
      navigator.clipboard.writeText(rawReview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle size={14} className="text-red-500 flex-shrink-0" />;
      case 'warning': return <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />;
      case 'info': return <Info size={14} className="text-blue-500 flex-shrink-0" />;
      default: return <Info size={14} className="text-slate-400 flex-shrink-0" />;
    }
  };

  const getScoreGradient = (score: number) => {
    if (score >= 8) return 'from-emerald-500 to-green-600';
    if (score >= 5) return 'from-amber-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const analysisSteps = [
    { label: 'Fetching PR diff...', icon: GitPullRequest },
    { label: 'Analyzing Terraform config...', icon: Shield },
    { label: 'Checking IAM policies...', icon: Shield },
    { label: 'Evaluating security compliance...', icon: CheckCircle },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gradient-to-b from-slate-50 to-white">
      {/* Header Section */}
      <div className="p-4 bg-white border-b border-slate-200/60">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
            <GitPullRequest size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">PR Code Review</h2>
            <p className="text-[10px] text-slate-400">AI-powered against Zions security standards</p>
          </div>
        </div>

        {currentUrl && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-slate-50 rounded-lg border border-slate-200/60">
            <ExternalLink size={11} className="text-slate-400 flex-shrink-0" />
            <span className="text-[11px] text-slate-500 truncate font-mono">{currentUrl}</span>
            {detectedPR && (
              <span className="flex-shrink-0 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                PR Detected
              </span>
            )}
          </div>
        )}

        <button
          onClick={analyzeCurrentPR}
          disabled={isAnalyzing}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold hover:from-violet-700 hover:to-purple-700 disabled:opacity-60 transition-all shadow-sm shadow-violet-200"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw size={15} className="animate-spin" />
              Analyzing PR...
            </>
          ) : (
            <>
              <Play size={15} />
              Analyze Current PR
            </>
          )}
        </button>
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <div className="p-4 space-y-2">
          {analysisSteps.map((step, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-500
                ${analyzeStep > i
                  ? 'bg-emerald-50 border border-emerald-200/60'
                  : analyzeStep === i
                    ? 'bg-blue-50 border border-blue-200/60'
                    : 'bg-slate-50 border border-slate-200/60 opacity-40'
                }`}
            >
              {analyzeStep > i ? (
                <CheckCircle size={14} className="text-emerald-500" />
              ) : analyzeStep === i ? (
                <RefreshCw size={14} className="text-blue-500 animate-spin" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300" />
              )}
              <span className={`text-xs font-medium ${analyzeStep >= i ? 'text-slate-700' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="m-4 p-3 bg-red-50 border border-red-200/60 rounded-xl animate-fadeIn">
          <div className="flex items-start gap-2">
            <XCircle size={14} className="text-red-500 mt-0.5" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Review Results */}
      {review && (
        <div className="p-4 space-y-3 animate-slideUp">
          {/* Score Card */}
          <div className="relative overflow-hidden rounded-xl p-4 bg-white border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Quality Score</p>
                <p className="text-xs text-slate-600 mt-0.5">{review.recommendation}</p>
              </div>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getScoreGradient(review.score)} flex items-center justify-center shadow-lg`}>
                <span className="text-xl font-black text-white">{review.score}</span>
              </div>
            </div>
            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getScoreGradient(review.score)} transition-all duration-1000`}
                style={{ width: `${review.score * 10}%` }}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Summary</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{review.summary}</p>
          </div>

          {/* Issues */}
          {review.issues.length > 0 && (
            <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Issues ({review.issues.length})
                </h3>
                <div className="flex gap-1.5">
                  {['critical', 'warning', 'info'].map(sev => {
                    const count = review.issues.filter(i => i.severity === sev).length;
                    if (!count) return null;
                    return (
                      <span key={sev} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full
                        ${sev === 'critical' ? 'bg-red-100 text-red-700' : ''}
                        ${sev === 'warning' ? 'bg-amber-100 text-amber-700' : ''}
                        ${sev === 'info' ? 'bg-blue-100 text-blue-700' : ''}
                      `}>
                        {count} {sev}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1.5">
                {review.issues.map((issue, i) => (
                  <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border
                    ${issue.severity === 'critical' ? 'bg-red-50/50 border-red-200/60' : ''}
                    ${issue.severity === 'warning' ? 'bg-amber-50/50 border-amber-200/60' : ''}
                    ${issue.severity === 'info' ? 'bg-blue-50/50 border-blue-200/60' : ''}
                  `}>
                    {getSeverityIcon(issue.severity)}
                    <p className="text-xs text-slate-600 leading-relaxed flex-1">{issue.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Review Toggle */}
          {rawReview && (
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="w-full flex items-center justify-between p-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <span>Detailed AI Review</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); copyReview(); }}
                    className="p-1 hover:bg-slate-100 rounded"
                  >
                    {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-slate-400" />}
                  </button>
                  <span className="text-slate-400">{showRaw ? '▲' : '▼'}</span>
                </div>
              </button>
              {showRaw && (
                <div className="px-3 pb-3 border-t border-slate-100">
                  <div className="markdown-content text-xs text-slate-600 mt-2">
                    <ReactMarkdown>{rawReview}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-semibold hover:bg-emerald-100 transition-all">
              <CheckCircle size={14} />
              Approve
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 text-xs font-semibold hover:bg-amber-100 transition-all">
              <AlertCircle size={14} />
              Request Changes
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isAnalyzing && !review && !error && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
              <GitPullRequest size={28} className="text-violet-400" />
            </div>
            <p className="text-sm font-medium text-slate-500">Navigate to a PR page</p>
            <p className="text-xs text-slate-400 mt-1">then click "Analyze Current PR"</p>
            <div className="flex items-center gap-2 justify-center mt-4 text-[10px] text-slate-400">
              <span className="px-2 py-0.5 bg-slate-100 rounded-full">Azure DevOps</span>
              <span className="px-2 py-0.5 bg-slate-100 rounded-full">GitHub</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
