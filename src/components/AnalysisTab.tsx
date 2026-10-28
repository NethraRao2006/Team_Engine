import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  Package,
  ArrowRight,
  MessageCircle,
  Copy,
  Send,
  HelpCircle,
  ChevronRight,
  Lightbulb,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { Product, Activity, Customer, AuditLogEntry, ShopProfile, StoreAnalysis } from '../types';
import { store } from '../services/store';

interface AnalysisTabProps {
  products: Product[];
  activities: Activity[];
  customers: Customer[];
  auditLogs: AuditLogEntry[];
  profile: ShopProfile;
  onShowToast: (msg: string) => void;
  onNavigateTab: (tab: string) => void;
}

export function AnalysisTab({
  products,
  activities,
  customers,
  auditLogs,
  profile,
  onShowToast,
  onNavigateTab,
}: AnalysisTabProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<StoreAnalysis | null>(null);
  const [analyzedTime, setAnalyzedTime] = useState<string>('');
  const [advisorQuestion, setAdvisorQuestion] = useState('');
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorAnswer, setAdvisorAnswer] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'reorder' | 'udhaar' | 'ask'>('overview');

  // Trigger analysis
  const runAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products,
          activities,
          customers,
          auditLogs,
          shopName: profile.name,
        }),
      });

      const res = await response.json();
      if (res.data) {
        setAnalysis(res.data);
        setAnalyzedTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        onShowToast('Gemini AI Analysis generated successfully!');

        // Log to Audit trail
        store.addAuditLog({
          category: 'ai',
          action: 'AI_ANALYSIS_EXECUTED',
          actor: 'Gemini 3.8 Flash',
          summary: `Generated full store health report. Score: ${res.data.healthScore}/100 (${res.data.healthStatus})`,
          severity: 'info',
          channel: 'system',
          metadata: { healthScore: res.data.healthScore, healthStatus: res.data.healthStatus },
        });
      } else if (res.fallback) {
        setAnalysis(res.fallback);
        setAnalyzedTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err: any) {
      console.error(err);
      onShowToast('Could not reach Gemini analysis endpoint. Using local intelligence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Run initial analysis if not yet loaded
    if (!analysis) {
      runAnalysis();
    }
  }, []);

  // Ask Kirana Advisor
  const handleAskAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisorQuestion.trim()) return;

    setAdvisorLoading(true);
    setAdvisorAnswer(null);
    try {
      const response = await fetch('/api/ask-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: advisorQuestion.trim(),
          storeSummary: {
            shopName: profile.name,
            totalProducts: products.length,
            lowStockItems: products.filter((p) => p.stock <= p.minStock).map((p) => p.name),
            totalUdhaar: customers.reduce((sum, c) => sum + (c.balance || 0), 0),
          },
        }),
      });

      const res = await response.json();
      if (res.answer) {
        setAdvisorAnswer(res.answer);
      }
    } catch (err: any) {
      onShowToast('Error consulting AI advisor.');
    } finally {
      setAdvisorLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onShowToast(`Copied ${label} to clipboard!`);
  };

  const sampleQuestions = [
    'How do I recover ₹450 pending udhaar politely without losing the customer?',
    'Which 3 products give the highest profit margin for a kirana shop?',
    'What should I stock more of before the weekend?',
    'ಉದಾರ ಬಾಕಿ ವಸೂಲಿಗೆ ಕನ್ನಡ ಸಂದೇಶ ಕೊಡಿ',
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900/40 overflow-hidden">
      {/* Header bar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles size={17} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                Gemini Business Intelligence
                <span className="bg-purple-500/20 text-purple-300 text-[9px] px-1.5 py-0.2 rounded-full font-bold border border-purple-500/30">
                  gemini-3.8-flash
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">
                {analyzedTime ? `Updated at ${analyzedTime}` : 'Real-time store analysis'}
              </p>
            </div>
          </div>

          <button
            onClick={runAnalysis}
            disabled={loading}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-xl shadow-sm transition active:scale-95 disabled:opacity-50"
            title="Refresh AI Analysis"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Analyzing…' : 'Re-Analyze'}</span>
          </button>
        </div>

        {/* Subtabs */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`flex-1 text-[11px] font-semibold py-1 rounded-lg transition ${
              activeSubTab === 'overview' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveSubTab('reorder')}
            className={`flex-1 text-[11px] font-semibold py-1 rounded-lg transition ${
              activeSubTab === 'reorder' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Reorder Radar
          </button>
          <button
            onClick={() => setActiveSubTab('udhaar')}
            className={`flex-1 text-[11px] font-semibold py-1 rounded-lg transition ${
              activeSubTab === 'udhaar' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Credit Risk
          </button>
          <button
            onClick={() => setActiveSubTab('ask')}
            className={`flex-1 text-[11px] font-semibold py-1 rounded-lg transition ${
              activeSubTab === 'ask' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ask AI
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
            <h4 className="text-sm font-bold text-slate-200">Gemini is analyzing your Kirana store...</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Evaluating stock movement, safety levels, customer udhaar exposure, and margin optimization.
            </p>
          </div>
        ) : analysis ? (
          <>
            {/* SUBTAB 1: OVERVIEW */}
            {activeSubTab === 'overview' && (
              <div className="space-y-3">
                {/* Health Score Hero Card */}
                <div className="bg-gradient-to-br from-indigo-950/70 via-slate-800 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                        Kirana Health Index
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-extrabold text-white">{analysis.healthScore}</span>
                        <span className="text-xs text-slate-400">/ 100</span>
                        <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                          {analysis.healthStatus}
                        </span>
                      </div>
                    </div>

                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <Zap size={28} className="text-indigo-400" />
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-700/60 h-2 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${analysis.healthScore}%` }}
                    ></div>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/60 space-y-1.5">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-1">
                    <Lightbulb size={12} />
                    Executive Briefing
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {analysis.executiveSummary}
                  </p>
                </div>

                {/* Regional Kannada Summary Card */}
                {analysis.kannadaSummary && (
                  <div className="bg-gradient-to-r from-amber-950/30 to-slate-800/80 rounded-2xl p-3.5 border border-amber-500/30 space-y-1.5">
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1">
                      <span>ಕನ್ನಡ</span>
                      ಅಂಗಡಿಯ ಸಾರಾಂಶ (Kannada Summary)
                    </span>
                    <p className="text-xs text-amber-100/90 leading-relaxed font-sans font-medium">
                      {analysis.kannadaSummary}
                    </p>
                  </div>
                )}

                {/* Prioritized Action Plan */}
                {analysis.actionPlan && analysis.actionPlan.length > 0 && (
                  <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/60 space-y-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                      Prioritized Next Steps
                    </span>
                    <div className="space-y-2">
                      {analysis.actionPlan.map((action, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-700/50 flex items-start gap-2.5"
                        >
                          <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 text-[10px] font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5 border border-indigo-500/40">
                            {action.priority}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-100">{action.title}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">{action.action}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Profit Opportunities */}
                {analysis.profitOpportunities && analysis.profitOpportunities.length > 0 && (
                  <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/60 space-y-2">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                      <TrendingUp size={12} />
                      Profit & Margin Boosters
                    </span>
                    <div className="space-y-2">
                      {analysis.profitOpportunities.map((opp, idx) => (
                        <div key={idx} className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/40">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-slate-200">{opp.title}</h5>
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                              {opp.impact}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">{opp.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUBTAB 2: REORDER RADAR */}
            {activeSubTab === 'reorder' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Reorder Urgency Radar</span>
                  <button
                    onClick={() => onNavigateTab('inventory')}
                    className="text-[11px] text-indigo-400 font-medium hover:underline flex items-center gap-0.5"
                  >
                    View All Inventory <ArrowRight size={11} />
                  </button>
                </div>

                <div className="space-y-2">
                  {analysis.inventoryInsights.map((item, idx) => {
                    const isCrit = item.severity === 'critical';
                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl p-3 border transition ${
                          isCrit
                            ? 'bg-rose-950/20 border-rose-500/40'
                            : 'bg-slate-800/80 border-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-100">{item.productName}</h4>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              isCrit
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {item.severity} · ~{item.daysLeftEstimate} days left
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 mt-1.5">{item.recommendation}</p>

                        <div className="mt-2 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">
                            Suggested order: <strong className="text-white">+{item.suggestedReorderQty} units</strong>
                          </span>
                          <button
                            onClick={() => {
                              const found = products.find((p) => p.name.includes(item.productName));
                              if (found) {
                                const msg = `Namaste, please send ${item.suggestedReorderQty} ${found.unit} of ${found.name} for ${profile.name}. Thank you!`;
                                window.open(
                                  `https://wa.me/${profile.supplierPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                    msg
                                  )}`,
                                  '_blank'
                                );
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1"
                          >
                            <MessageCircle size={10} />
                            Order Now
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUBTAB 3: CREDIT RISK (UDHAAR) */}
            {activeSubTab === 'udhaar' && (
              <div className="space-y-3">
                <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Credit Risk Assessment
                      </span>
                      <div className="text-base font-extrabold text-white mt-0.5">
                        Risk Level: <span className="text-amber-400">{analysis.creditRiskAnalysis.riskLevel}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20">
                      ₹{analysis.creditRiskAnalysis.totalExposure.toLocaleString('en-IN')} Total
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {analysis.creditRiskAnalysis.advice}
                  </p>
                </div>

                {/* AI WhatsApp Reminder Templates */}
                <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/60 space-y-2.5">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide block">
                    AI-Drafted Gentle Reminders
                  </span>

                  {/* English Template */}
                  <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/50 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">English Template</span>
                      <button
                        onClick={() =>
                          copyToClipboard(analysis.creditRiskAnalysis.whatsappReminderEnglish, 'English Reminder')
                        }
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <Copy size={11} />
                        <span>Copy</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 italic">
                      "{analysis.creditRiskAnalysis.whatsappReminderEnglish}"
                    </p>
                  </div>

                  {/* Kannada Template */}
                  <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/50 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-amber-300">ಕನ್ನಡ ಸಂದೇಶ (Kannada Template)</span>
                      <button
                        onClick={() =>
                          copyToClipboard(analysis.creditRiskAnalysis.whatsappReminderKannada, 'Kannada Reminder')
                        }
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        <Copy size={11} />
                        <span>Copy</span>
                      </button>
                    </div>
                    <p className="text-xs text-amber-100/90 italic font-sans">
                      "{analysis.creditRiskAnalysis.whatsappReminderKannada}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 4: ASK GEMINI ADVISOR */}
            {activeSubTab === 'ask' && (
              <div className="space-y-3">
                <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-indigo-400" />
                    <h3 className="text-xs font-bold text-slate-100">Ask Kirana Retail Consultant</h3>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Ask any question about store profits, supplier bargaining, regional stock planning, or udhaar recovery.
                  </p>

                  <form onSubmit={handleAskAdvisor} className="space-y-2 pt-1">
                    <textarea
                      rows={2}
                      value={advisorQuestion}
                      onChange={(e) => setAdvisorQuestion(e.target.value)}
                      placeholder="e.g. Which items should I order more of for the festival?"
                      className="w-full bg-slate-900 text-slate-100 placeholder-slate-400 text-xs p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                    />

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!advisorQuestion.trim() || advisorLoading}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-md transition active:scale-95 disabled:opacity-40 flex items-center gap-1.5"
                      >
                        {advisorLoading ? (
                          <RefreshCw size={13} className="animate-spin" />
                        ) : (
                          <Send size={13} />
                        )}
                        <span>Ask Gemini</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Response Card */}
                {advisorAnswer && (
                  <div className="bg-indigo-950/30 border border-indigo-500/40 rounded-2xl p-3.5 space-y-1.5 animate-in fade-in">
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wide flex items-center gap-1">
                      <Sparkles size={11} />
                      Advisor's Recommendation
                    </span>
                    <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                      {advisorAnswer}
                    </div>
                  </div>
                )}

                {/* Sample Prompt Chips */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Suggested Questions:</span>
                  <div className="space-y-1.5">
                    {sampleQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => setAdvisorQuestion(q)}
                        className="w-full text-left bg-slate-800/60 hover:bg-slate-800 p-2 rounded-xl border border-slate-700/50 text-[11px] text-slate-300 transition"
                      >
                        "{q}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-slate-400 space-y-2">
            <Sparkles size={32} className="mx-auto text-indigo-400" />
            <p className="text-xs">Tap "Re-Analyze" above to generate store intelligence.</p>
          </div>
        )}
      </div>
    </div>
  );
}
