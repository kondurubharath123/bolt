import type { RequestStatus } from '../lib/types';

interface StatusBadgeProps {
  status: RequestStatus;
}

const statusConfig: Record<RequestStatus, { bg: string; text: string; dot: string }> = {
  'Draft': { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
  'Pending Approval': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  'Approved': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  'Rejected': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
}
