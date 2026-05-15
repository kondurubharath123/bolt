import { X, User } from 'lucide-react';
import type { User as UserType } from '../lib/types';

interface UserSwitcherProps {
  users: UserType[];
  onSelect: (user: UserType) => void;
  onClose: () => void;
}

export default function UserSwitcher({ users, onSelect, onClose }: UserSwitcherProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Select User</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-4 space-y-2">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => { onSelect(user); onClose(); }}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                user.role === 'APPROVER' ? 'bg-emerald-100' : 'bg-amber-100'
              }`}>
                <User className={`w-5 h-5 ${user.role === 'APPROVER' ? 'text-emerald-600' : 'text-amber-600'}`} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-slate-900">{user.username}</p>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  user.role === 'APPROVER'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {user.role}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
