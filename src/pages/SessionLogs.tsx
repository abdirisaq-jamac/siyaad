import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Clock, Monitor, Smartphone, Tablet, User } from 'lucide-react';
import { getUserSessions } from '../services/storage';
import type { UserSession } from '../types';

export default function SessionLogs() {
  const [sessions, setSessions] = useState<UserSession[]>([]);

  useEffect(() => {
    setSessions(getUserSessions());
  }, []);

  const getDeviceIcon = (type: string) => {
    if (type === 'Mobile') return <Smartphone size={16} />;
    if (type === 'Tablet') return <Tablet size={16} />;
    return <Monitor size={16} />;
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header" style={{ maxWidth: '1200px', margin: '0 auto 1.5rem' }}>
        <div>
          <div className="page-title">Login History</div>
          <div className="page-subtitle">Track user sessions, devices, and login activities</div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="glass-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: '800px' }}>
            <thead>
              <tr>
                <th>User</th>
                <th>Device Type</th>
                <th>Browser / OS</th>
                <th>Login Time</th>
                <th>Logout Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr key={s.id || i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ background: 'var(--bg-main)', padding: '0.4rem', borderRadius: '50%', color: 'var(--primary-color)' }}>
                        <User size={16} />
                      </div>
                      <span style={{ fontWeight: 600 }}>{s.username}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                      {getDeviceIcon(s.deviceType)} {s.deviceType}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{s.browser}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.os}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 500 }}>{new Date(s.loginTime).toLocaleString()}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getRelativeTime(s.loginTime)}</span>
                    </div>
                  </td>
                  <td>
                    {s.logoutTime ? (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 500 }}>{new Date(s.logoutTime).toLocaleString()}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getRelativeTime(s.logoutTime)}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>—</span>
                    )}
                  </td>
                  <td>
                    {s.logoutTime ? (
                      <span className="badge-rejected" style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>Logged Out</span>
                    ) : (
                      <span className="badge-active">Active Session</span>
                    )}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
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
