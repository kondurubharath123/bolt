import { useState, useEffect } from 'react';
import { api } from './lib/supabase';
import type { User } from './lib/types';
import Sidebar from './components/Sidebar';
import UserSwitcher from './components/UserSwitcher';
import Dashboard from './pages/Dashboard';
import NewRequest from './pages/NewRequest';
import AuditLogs from './pages/AuditLogs';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const data = await api.getUsers();
    if (!data.error && data.length > 0) {
      setUsers(data);
      if (!currentUser) {
        setCurrentUser(data[0]);
      }
    }
  }

  function handleNavigate(view: string) {
    setActiveView(view);
  }

  function renderView() {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard key={refreshKey} currentUser={currentUser} />;
      case 'new-request':
        return <NewRequest currentUser={currentUser} onRequestCreated={() => setRefreshKey((k) => k + 1)} />;
      case 'audit-logs':
        return <AuditLogs />;
      default:
        return <Dashboard key={refreshKey} currentUser={currentUser} />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onSwitchUser={() => setShowUserSwitcher(true)}
      />
      <main className="ml-64 p-8">
        {renderView()}
      </main>
      {showUserSwitcher && (
        <UserSwitcher
          users={users}
          onSelect={(user) => { setCurrentUser(user); setRefreshKey((k) => k + 1); }}
          onClose={() => setShowUserSwitcher(false)}
        />
      )}
    </div>
  );
}

export default App;
