import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Monitor, Smartphone, Tablet, User, RefreshCw } from 'lucide-react';
import { getUserSessions } from '../services/storage';
import type { UserSession } from '../types';

export default function SessionLogs() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const data = getUserSessions();
    setSessions(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getDeviceIcon = (type: string) => {
    if (type === 'Mobile') return <Smartphone size={16} />;
    if (type === 'Tablet') return <Tablet size={16} />;
    return <Monitor size={16} />;
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header" style={{ maxWidth: '1200px', margin: '0 auto 1.5rem' }}>
        <div>
          <div className="page-title">Login History</div>
          <div className="page-subtitle">All user sessions — device, browser, login and logout times</div>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-secondary" onClick={load}>
          <RefreshCw size={16} /> Refresh
        </motion.button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="glass-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: '800px' }}>
            <thead>
              <tr>
                <th>User</th>
                <th>Device</th>
                <th>Browser / OS</th>
                <th>Login Time</th>
                <th>Logout Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ width: 40, height: 40, border: '4px solid var(--border-color)', borderTop: '4px solid var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                  </td>
                </tr>
              ) : sessions.map((s, i) => (
                <tr key={s.id || i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ background: 'var(--primary-gradient)', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                        {s.username?.[0]?.toUpperCase() || <User size={14} />}
                      </div>
                      <span style={{ fontWeight: 600 }}>{s.username}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                      <span style={{ color: 'var(--primary-color)' }}>{getDeviceIcon(s.deviceType)}</span> {s.deviceType}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{s.browser}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.os}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{new Date(s.loginTime).toLocaleString()}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getRelativeTime(s.loginTime)}</div>
                  </td>
                  <td>
                    {s.logoutTime ? (
                      <>
                        <div style={{ fontWeight: 500 }}>{new Date(s.logoutTime).toLocaleString()}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getRelativeTime(s.logoutTime)}</div>
                      </>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>}
                  </td>
                  <td>
                    {s.logoutTime
                      ? <span className="badge-pending">Logged Out</span>
                      : <span className="badge-active">● Active</span>
                    }
                  </td>
                </tr>
              ))}
              {!loading && sessions.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <Shield size={48} style={{ opacity: 0.2, margin: '0 auto 1rem', display: 'block' }} />
                    No session logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
