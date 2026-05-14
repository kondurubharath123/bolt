import { X, FileText, User, Clock, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import type { DeviationRequest } from '../lib/types';
import StatusBadge from './StatusBadge';
import { useState } from 'react';

interface RequestModalProps {
  request: DeviationRequest;
  onClose: () => void;
  onApprove: (id: string, comments?: string) => void;
  onReject: (id: string, comments: string) => void;
  isApprover: boolean;
  isProcessing: boolean;
}

export default function RequestModal({ request, onClose, onApprove, onReject, isApprover, isProcessing }: RequestModalProps) {
  const [showReject, setShowReject] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [approveComment, setApproveComment] = useState('');
  const canAct = isApprover && request.status === 'Pending Approval';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Request Details</h2>
            <StatusBadge status={request.status} />
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Customer ID</p>
              <p className="text-sm font-semibold text-slate-900">{request.customer_id}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Deviation Type</p>
              <p className="text-sm font-semibold text-slate-900">{request.deviation_type}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Created By</p>
              <p className="text-sm font-semibold text-slate-900">{request.users?.username || 'Unknown'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Created</p>
              <p className="text-sm font-semibold text-slate-900">{new Date(request.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Business Justification
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-4">
              {request.business_justification}
            </p>
          </div>

          {request.ai_justification && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                AI Justification
              </h3>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm text-blue-800 leading-relaxed">{request.ai_justification}</p>
              </div>
            </div>
          )}

          {request.logs && request.logs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Audit Trail</h3>
              <div className="space-y-2">
                {request.logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium text-slate-900">{log.users?.username || 'System'}</span>
                      <span className="text-slate-500"> {log.action} </span>
                      <span className="text-slate-400">({log.previous_state} → {log.new_state})</span>
                      {log.comments && <p className="text-slate-500 mt-0.5">{log.comments}</p>}
                      <p className="text-[10px] text-slate-400 mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {canAct && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            {!showReject ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Approval comment (optional)</label>
                  <input
                    type="text"
                    value={approveComment}
                    onChange={(e) => setApproveComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => onApprove(request.id, approveComment || undefined)}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => setShowReject(true)}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-xs text-red-600 font-semibold block">Rejection comment (required)</label>
                <textarea
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  placeholder="Provide a reason for rejection..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => onReject(request.id, rejectComment)}
                    disabled={isProcessing || !rejectComment.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Confirm Rejection
                  </button>
                  <button
                    onClick={() => { setShowReject(false); setRejectComment(''); }}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
