import { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  FileText,
  Clock,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Info,
  Flame,
  User,
  Radio,
  FileSpreadsheet,
} from 'lucide-react';
import { AuditLogEntry, AuditCategory, AuditSeverity } from '../types';

interface AuditLogTabProps {
  auditLogs: AuditLogEntry[];
  onShowToast: (msg: string) => void;
}

export function AuditLogTab({ auditLogs, onShowToast }: AuditLogTabProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [activeLogDetail, setActiveLogDetail] = useState<AuditLogEntry | null>(null);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Logs' },
    { id: 'inventory', label: '📦 Inventory' },
    { id: 'financial', label: '💰 Financial / Udhaar' },
    { id: 'settings', label: '⚙️ Settings' },
    { id: 'ai', label: '🧠 AI Engine' },
    { id: 'security', label: '🛡️ Security' },
  ];

  const severities: { id: string; label: string }[] = [
    { id: 'all', label: 'All Severities' },
    { id: 'info', label: 'Info' },
    { id: 'success', label: 'Success' },
    { id: 'warning', label: 'Warning' },
    { id: 'critical', label: 'Critical' },
  ];

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        log.summary.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.actor.toLowerCase().includes(search.toLowerCase()) ||
        (log.diffs && log.diffs.some((d) => d.entity.toLowerCase().includes(search.toLowerCase())));

      if (!matchesSearch) return false;
      if (selectedCategory !== 'all' && log.category !== selectedCategory) return false;
      if (selectedSeverity !== 'all' && log.severity !== selectedSeverity) return false;
      return true;
    });
  }, [auditLogs, search, selectedCategory, selectedSeverity]);

  // Statistics
  const todayLogs = useMemo(() => {
    const todayStr = new Date().toDateString();
    return auditLogs.filter((l) => new Date(l.timestamp).toDateString() === todayStr);
  }, [auditLogs]);

  const inventoryLogs = useMemo(() => auditLogs.filter((l) => l.category === 'inventory'), [auditLogs]);
  const financialLogs = useMemo(() => auditLogs.filter((l) => l.category === 'financial'), [auditLogs]);

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Category', 'Action', 'Actor', 'Severity', 'Channel', 'Summary', 'Diffs'];
    const rows = filteredLogs.map((l) => {
      const diffStr = (l.diffs || [])
        .map((d) => `${d.entity}.${d.field}: ${d.before} -> ${d.after} ${d.unit || ''}`)
        .join('; ');
      return [
        `"${new Date(l.timestamp).toISOString()}"`,
        `"${l.category}"`,
        `"${l.action}"`,
        `"${l.actor}"`,
        `"${l.severity}"`,
        `"${l.channel}"`,
        `"${l.summary.replace(/"/g, '""')}"`,
        `"${diffStr.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kirana_audit_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast(`Exported ${filteredLogs.length} audit logs to CSV.`);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `kirana_audit_log_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast(`Exported ${filteredLogs.length} audit logs to JSON.`);
  };

  const getSeverityBadge = (sev: AuditSeverity) => {
    switch (sev) {
      case 'success':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'warning':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'critical':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900/40 overflow-hidden">
      {/* Top Banner & Metrics */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                Audit Log & Compliance Trail
                <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-1.5 py-0.2 rounded-full font-bold border border-emerald-500/30">
                  Tamper-Evident
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">Every stock, cash, and udhaar event logged</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportCSV}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 text-[11px] font-medium flex items-center gap-1 shadow-xs transition"
              title="Download CSV report"
            >
              <FileSpreadsheet size={13} className="text-emerald-400" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 text-[11px] font-medium flex items-center gap-1 shadow-xs transition"
              title="Download JSON report"
            >
              <Download size={13} className="text-indigo-400" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-800/80 rounded-xl p-2 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block">Total Audits</span>
            <strong className="text-sm font-bold text-white">{auditLogs.length}</strong>
          </div>
          <div className="bg-slate-800/80 rounded-xl p-2 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block">Today</span>
            <strong className="text-sm font-bold text-indigo-300">{todayLogs.length}</strong>
          </div>
          <div className="bg-slate-800/80 rounded-xl p-2 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block">Financial</span>
            <strong className="text-sm font-bold text-emerald-400">{financialLogs.length}</strong>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by actor, product, or action..."
            className="w-full bg-slate-800/90 text-slate-100 placeholder-slate-400 text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`flex-shrink-0 text-[10px] px-2.5 py-1 rounded-full font-medium transition ${
                selectedCategory === c.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <ShieldCheck size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs">No audit logs found matching criteria.</p>
          </div>
        ) : (
          filteredLogs.map((entry) => (
            <div
              key={entry.id}
              onClick={() => setActiveLogDetail(entry)}
              className="bg-slate-800/80 hover:bg-slate-800 cursor-pointer rounded-2xl p-3 border border-slate-700/60 hover:border-slate-600 transition shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getSeverityBadge(
                      entry.severity
                    )}`}
                  >
                    {entry.action}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(entry.timestamp).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <User size={10} />
                  <span>{entry.actor}</span>
                </div>
              </div>

              {/* Summary */}
              <p className="text-slate-100 font-medium text-xs leading-snug">{entry.summary}</p>

              {/* Diffs visualization pill */}
              {entry.diffs && entry.diffs.length > 0 && (
                <div className="bg-slate-900/80 rounded-xl p-2 border border-slate-700/50 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">
                    State Diff:
                  </span>
                  <div className="space-y-1">
                    {entry.diffs.map((d, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 font-medium">{d.entity}</span>
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="text-rose-400 line-through">
                            {d.before} {d.unit || ''}
                          </span>
                          <ArrowRight size={10} className="text-slate-400" />
                          <span className="text-emerald-400 font-bold">
                            {d.after} {d.unit || ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer info: channel & inspect */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[10px] text-slate-400">
                <span className="capitalize">Channel: {entry.channel.replace(/_/g, ' ')}</span>
                <span className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-0.5">
                  Inspect raw <ArrowRight size={10} />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Inspection Modal */}
      {activeLogDetail && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Audit Entry Snapshot</h3>
              </div>
              <button
                onClick={() => setActiveLogDetail(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Log ID:</span>
                  <span className="font-mono text-slate-200">{activeLogDetail.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Timestamp:</span>
                  <span className="text-slate-200">
                    {new Date(activeLogDetail.timestamp).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Action:</span>
                  <span className="font-bold text-indigo-400">{activeLogDetail.action}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Actor:</span>
                  <span className="text-slate-200">{activeLogDetail.actor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Channel:</span>
                  <span className="text-slate-200">{activeLogDetail.channel}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-300 block mb-1">Human Summary</span>
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700 text-slate-200">
                  {activeLogDetail.summary}
                </div>
              </div>

              {activeLogDetail.diffs && (
                <div>
                  <span className="font-semibold text-slate-300 block mb-1">Entity Diff Breakdown</span>
                  <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700 space-y-1">
                    {activeLogDetail.diffs.map((d, i) => (
                      <div key={i} className="flex justify-between text-[11px]">
                        <span className="text-slate-300">{d.entity} ({d.field})</span>
                        <span className="font-mono text-emerald-400">
                          {d.before} → {d.after} {d.unit || ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="font-semibold text-slate-300 block mb-1">Raw JSON Payload</span>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-300 overflow-x-auto max-h-40">
                  {JSON.stringify(activeLogDetail, null, 2)}
                </pre>
              </div>
            </div>

            <button
              onClick={() => setActiveLogDetail(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 rounded-xl border border-slate-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
