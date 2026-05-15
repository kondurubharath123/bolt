import { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle2, XCircle, TrendingUp, FileText } from 'lucide-react';
import { api } from '../lib/supabase';
import type { DeviationRequest } from '../lib/types';
import StatusBadge from '../components/StatusBadge';
import RequestModal from '../components/RequestModal';

interface DashboardProps {
  currentUser: { id: string; username: string; role: string } | null;
}

export default function Dashboard({ currentUser }: DashboardProps) {
  const [requests, setRequests] = useState<DeviationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<DeviationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    const data = await api.getRequests();
    if (!data.error) setRequests(data);
    setLoading(false);
  }

  async function handleApprove(id: string, comments?: string) {
    if (!currentUser) return;
    setProcessing(true);
    await api.approveRequest(id, currentUser.id, comments);
    await loadRequests();
    setSelectedRequest(null);
    setProcessing(false);
  }

  async function handleReject(id: string, comments: string) {
    if (!currentUser) return;
    setProcessing(true);
    await api.rejectRequest(id, currentUser.id, comments);
    await loadRequests();
    setSelectedRequest(null);
    setProcessing(false);
  }

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'Pending Approval').length,
    approved: requests.filter((r) => r.status === 'Approved').length,
    rejected: requests.filter((r) => r.status === 'Rejected').length,
  };

  const filteredRequests = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  const statCards = [
    { label: 'Total Requests', value: stats.total, icon: FileText, color: 'bg-slate-100 text-slate-600' },
    { label: 'Pending Approval', value: stats.pending, icon: Clock, color: 'bg-amber-50 text-amber-600' },
    { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'bg-red-50 text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of deviation requests and approvals</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">All Requests</h2>
          <div className="flex gap-1">
            {['all', 'Pending Approval', 'Approved', 'Rejected', 'Draft'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-400 mt-3">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-400 mt-2">No requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-5 py-3 text-left font-medium">Customer ID</th>
                  <th className="px-5 py-3 text-left font-medium">Type</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Created By</th>
                  <th className="px-5 py-3 text-left font-medium">Date</th>
                  <th className="px-5 py-3 text-left font-medium">AI</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold text-slate-900">{req.customer_id}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-600">{req.deviation_type}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-600">{req.users?.username || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-400">{new Date(req.created_at).toLocaleDateString()}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {req.ai_justification ? (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                          <TrendingUp className="w-3 h-3" /> Generated
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedRequest && (
        <RequestModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          isApprover={currentUser?.role === 'APPROVER'}
          isProcessing={processing}
        />
      )}
    </div>
  );
}
