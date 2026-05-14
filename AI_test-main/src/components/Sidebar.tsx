import { LayoutDashboard, FilePlus, ScrollText, Shield, ChevronRight } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  currentUser: { username: string; role: string } | null;
  onSwitchUser: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'new-request', label: 'New Request', icon: FilePlus },
  { id: 'audit-logs', label: 'Audit Logs', icon: ScrollText },
];

export default function Sidebar({ activeView, onNavigate, currentUser, onSwitchUser }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white flex flex-col z-50">
      <div className="px-6 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">DeviationFlow</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Telecom Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 text-blue-400" />}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-700/50">
        {currentUser && (
          <div className="mb-3">
            <p className="text-xs text-slate-400 mb-1">Signed in as</p>
            <p className="text-sm font-medium text-white truncate">{currentUser.username}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              currentUser.role === 'APPROVER'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}>
              {currentUser.role}
            </span>
          </div>
        )}
        <button
          onClick={onSwitchUser}
          className="w-full text-xs text-slate-400 hover:text-white transition-colors py-1.5 rounded hover:bg-slate-800"
        >
          Switch User
        </button>
      </div>
    </aside>
  );
}
