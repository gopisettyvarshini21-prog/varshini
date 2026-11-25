import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Activity,
  Server,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Trash2,
  Users,
  Cpu,
  BarChart3,
  Layers,
  Lock,
} from 'lucide-react';
import { UserAuth } from '../types';

interface AdminPortalProps {
  currentUser: UserAuth | null;
  onOpenAuthModal: () => void;
  isDark: boolean;
  themeStyles: any;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  onOpenAuthModal,
  isDark,
  themeStyles,
  onShowToast,
}) => {
  const [stats, setStats] = useState<any>({
    totalRequests: 58,
    activeEngine: 'Google Gemini 3.8 Flash (Active)',
    averageLatencyMs: 380,
    uptimePercent: 99.99,
    supportedPersonas: ['Google Gemini 3.8', 'ChatGPT-4o', 'Claude 3.7 Sonnet', 'Perplexity AI', 'Microsoft Copilot'],
    recentLogs: [],
  });
  const [loading, setLoading] = useState(false);

  const fetchStats = () => {
    setLoading(true);
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
      })
      .catch((err) => {
        console.error('Admin stats fetch error:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div
        className={`p-10 rounded-3xl border text-center max-w-xl mx-auto space-y-4 my-8 ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
        } shadow-xl`}
      >
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className={`text-lg font-bold ${themeStyles.textPrimary}`}>
          Administrator Access Restricted
        </h3>
        <p className={`text-xs ${themeStyles.textMuted} leading-relaxed`}>
          This workspace is reserved for authorized administrators only. Sign in with your authorized administrator account to unlock telemetry and audit controls.
        </p>
        <button
          type="button"
          onClick={onOpenAuthModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Sign In as Administrator</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h2 className={`text-xl font-black ${themeStyles.textPrimary}`}>
              Admin Portal & Telemetry
            </h2>
          </div>
          <p className={`text-xs mt-1 ${themeStyles.textMuted}`}>
            Live system performance, multi-model persona routing, and audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
            isDark
              ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
              : 'bg-purple-50 text-purple-700 border-purple-200'
          }`}>
            Admin: {currentUser.name}
          </span>
          <button
            onClick={fetchStats}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              isDark ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-300 bg-white text-slate-700'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-2xl border ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase text-slate-400">Total Requests</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-500">{stats.totalRequests}</div>
          <span className="text-[10px] text-emerald-400 font-semibold">100% processed without drop</span>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase text-slate-400">Average Latency</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{stats.averageLatencyMs} ms</div>
          <span className="text-[10px] text-slate-400 font-medium">Ultra-low response delay</span>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase text-slate-400">System Uptime</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{stats.uptimePercent}%</div>
          <span className="text-[10px] text-emerald-400 font-semibold">Cloud Run Active</span>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase text-slate-400">Active Engine</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-black text-purple-300 truncate">Gemini 3.8 Flash</div>
          <span className="text-[10px] text-slate-400 font-medium">+ 4 Persona Emulators</span>
        </div>
      </div>

      {/* Model Personas Status Panel */}
      <div
        className={`p-5 rounded-2xl border ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${themeStyles.textSecondary}`}>
          Multi-Model AI Persona Routing Cluster
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          {[
            { name: 'Google Gemini 3.8', status: 'Primary Host (Native)', color: 'text-blue-400', latency: '340ms' },
            { name: 'ChatGPT-4o', status: 'Persona Emulated', color: 'text-emerald-400', latency: '410ms' },
            { name: 'Claude 3.7 Sonnet', status: 'Persona Emulated', color: 'text-amber-400', latency: '490ms' },
            { name: 'Perplexity AI', status: 'Persona Emulated', color: 'text-cyan-400', latency: '390ms' },
            { name: 'Microsoft Copilot', status: 'Persona Emulated', color: 'text-blue-500', latency: '360ms' },
          ].map((m) => (
            <div
              key={m.name}
              className={`p-3 rounded-xl border ${
                isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <span className={`font-bold block ${themeStyles.textPrimary}`}>{m.name}</span>
              <span className={`text-[10px] font-semibold ${m.color} block mt-0.5`}>{m.status}</span>
              <span className={`text-[10px] mt-1 block ${themeStyles.textMuted}`}>Latency: {m.latency}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="p-4 border-b border-slate-700/30 flex items-center justify-between">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${themeStyles.textSecondary}`}>
            Recent System Execution Logs
          </h3>
          <span className={`text-[11px] ${themeStyles.textMuted}`}>Live memory audit</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className={`text-[10px] uppercase font-bold border-b ${
                isDark
                  ? 'bg-slate-800/40 text-slate-400 border-slate-800'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              <tr>
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5">Task Type</th>
                <th className="px-4 py-2.5">Model Persona</th>
                <th className="px-4 py-2.5">Platform</th>
                <th className="px-4 py-2.5">Tokens Est.</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                isDark ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'
              }`}
            >
              {stats.recentLogs && stats.recentLogs.length > 0 ? (
                stats.recentLogs.map((log: any) => (
                  <tr
                    key={log.id}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className={`px-4 py-2.5 text-[11px] font-mono ${themeStyles.textMuted}`}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className={`px-4 py-2.5 font-bold ${themeStyles.textPrimary}`}>{log.type}</td>
                    <td className="px-4 py-2.5 text-blue-500 font-semibold">{log.model}</td>
                    <td className="px-4 py-2.5">{log.platform}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px]">{log.tokensEstimate}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No recent executions logged in this session.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
