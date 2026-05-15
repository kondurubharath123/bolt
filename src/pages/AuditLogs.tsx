import { useState, useEffect } from 'react';
import { ScrollText, User, ArrowRight, MessageSquare } from 'lucide-react';
import { api } from '../lib/supabase';
import type { ApprovalLog } from '../lib/types';

export default function AuditLogs() {
  const [logs, setLogs] = useState<ApprovalLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    const data = await api.getLogs();
    if (!data.error) setLogs(data);
    setLoading(false);
  }

  const actionColors: Record<string, string> = {
    Create: 'bg-slate-100 text-slate-700',
    Submit: 'bg-amber-50 text-amber-700',
    Approve: 'bg-emerald-50 text-emerald-700',
    Reject: 'bg-red-50 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-1">Complete audit trail of all deviation request actions</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-400 mt-3">Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <ScrollText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-400 mt-2">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-5 py-3 text-left font-medium">Timestamp</th>
                  <th className="px-5 py-3 text-left font-medium">Actor</th>
                  <th className="px-5 py-3 text-left font-medium">Action</th>
                  <th className="px-5 py-3 text-left font-medium">Request</th>
                  <th className="px-5 py-3 text-left font-medium">State Change</th>
                  <th className="px-5 py-3 text-left font-medium">Comments</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-600">{new Date(log.created_at).toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-sm font-medium text-slate-900">{log.users?.username || 'System'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${actionColors[log.action] || 'bg-slate-100 text-slate-700'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-600">
                        {log.deviation_requests?.customer_id} — {log.deviation_requests?.deviation_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{log.previous_state}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{log.new_state}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {log.comments ? (
                        <div className="flex items-start gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <span className="text-sm text-slate-500">{log.comments}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
