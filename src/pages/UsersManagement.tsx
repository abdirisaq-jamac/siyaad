import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Edit, Trash2, Shield, Search, X,
  Check, AlertTriangle, Eye, EyeOff, ChevronDown, Key, Clock, Monitor, Smartphone, Tablet
} from 'lucide-react';
import type { AppUser, UserRole, Permission, UserSession } from '../types';
import { getUsers, addUser, updateUser, deleteUser, buildDefaultPermissions, getUserSessions } from '../services/storage';
import { format } from 'date-fns';

const ROLE_SUGGESTIONS = ['Super Admin', 'Admin', 'Editor', 'Data Entry', 'Viewer'];

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  'Super Admin': { bg: 'rgba(139,92,246,0.15)', text: '#8b5cf6' },
  'Admin':       { bg: 'rgba(37,99,235,0.15)',  text: '#2563eb' },
  'Editor':      { bg: 'rgba(16,185,129,0.15)', text: '#10b981' },
  'Data Entry':  { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  'Viewer':      { bg: 'rgba(100,116,139,0.15)',text: '#64748b' },
};

const PERMISSION_GROUPS = [
  {
    group: 'Dashboard',
    keys: [{ key: 'viewDashboard', label: 'View Dashboard' }],
  },
  {
    group: 'Citizens',
    keys: [
      { key: 'viewCitizens',    label: 'View Citizens' },
      { key: 'registerCitizen', label: 'Register Citizen' },
      { key: 'editCitizen',     label: 'Edit Citizen' },
      { key: 'deleteCitizen',   label: 'Delete Citizen' },
      { key: 'printProfile',    label: 'Print Profile' },
      { key: 'exportProfile',   label: 'Export Profile (PDF)' },
    ],
  },
  {
    group: 'ID Cards',
    keys: [
      { key: 'viewIdCards',  label: 'View ID Cards' },
      { key: 'exportIdCard', label: 'Export ID Card' },
      { key: 'savePNG',      label: 'Save as PNG' },
      { key: 'exportPDF',    label: 'Export as PDF' },
    ],
  },
  {
    group: 'QR',
    keys: [
      { key: 'verifyQR',   label: 'Verify QR' },
      { key: 'generateQR', label: 'Generate QR' },
    ],
  },
  {
    group: 'Reports',
    keys: [
      { key: 'viewReports',   label: 'View Reports' },
      { key: 'exportReports', label: 'Export Reports' },
    ],
  },
  {
    group: 'Settings',
    keys: [
      { key: 'viewSettings', label: 'View Settings' },
      { key: 'editSettings', label: 'Edit Settings' },
    ],
  },
  {
    group: 'Users',
    keys: [
      { key: 'viewUsers',   label: 'View Users' },
      { key: 'manageUsers', label: 'Manage Users' },
    ],
  },
];

const emptyPermission = (): Permission => ({
  viewDashboard: false, viewCitizens: false, registerCitizen: false,
  editCitizen: false, deleteCitizen: false, printProfile: false, exportProfile: false, viewIdCards: false,
  exportIdCard: false, savePNG: false, exportPDF: false, verifyQR: false, generateQR: false, viewReports: false,
  exportReports: false, viewSettings: false, editSettings: false,
  viewUsers: false, manageUsers: false,
});

function generateId() {
  return 'usr-' + Math.random().toString(36).slice(2, 10);
}

export default function UsersManagement() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'permissions'>('info');
  const [viewSessionsUser, setViewSessionsUser] = useState<AppUser | null>(null);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);

  // Form state
  const [form, setForm] = useState({
    fullName: '', username: '', password: '',
    role: 'Viewer' as UserRole, isActive: true,
  });
  const [permissions, setPermissions] = useState<Permission>(emptyPermission());

  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (rawUser) {
        try { setCurrentUser(JSON.parse(rawUser)); } catch (e) {}
      }
      const res = await getUsers();
      setUsers(res);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const canManage = currentUser?.role === 'Super Admin' || currentUser?.permissions?.manageUsers === true;

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(query.toLowerCase()) ||
    u.username?.toLowerCase().includes(query.toLowerCase()) ||
    u.role.toLowerCase().includes(query.toLowerCase())
  );

  function openAdd() {
    setEditingUser(null);
    setForm({ fullName: '', username: '', password: '', role: 'Viewer', isActive: true });
    setPermissions(buildDefaultPermissions('Viewer'));
    setActiveTab('info');
    setShowModal(true);
  }

  function openEdit(user: AppUser) {
    setEditingUser(user);
    setForm({ fullName: user.fullName, username: user.username || (user as any).email || '', password: user.password, role: user.role, isActive: user.isActive });
    setPermissions({ ...user.permissions });
    setActiveTab('info');
    setShowModal(true);
  }

  function openSessions(user: AppUser) {
    setViewSessionsUser(user);
    setUserSessions(getUserSessions(user.id));
  }

  function handleRoleChange(role: UserRole) {
    setForm(f => ({ ...f, role }));
    setPermissions(buildDefaultPermissions(role));
  }

  function togglePerm(key: keyof Permission) {
    setPermissions(p => ({ ...p, [key]: !p[key] }));
  }

  async function handleSave() {
    if (!form.fullName.trim() || !form.username.trim() || !form.password.trim()) return;
    try {
      if (editingUser) {
        const updated: AppUser = { ...editingUser, ...form, permissions };
        await updateUser(updated);
      } else {
        const newUser: AppUser = {
          id: generateId(), ...form, permissions,
          createdAt: new Date().toISOString(), lastLogin: null, avatar: null,
        };
        await addUser(newUser);
      }
      setShowModal(false);
      await load();
    } catch (err: any) {
      alert(`Error saving user: ${err.message}`);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteUser(id);
      setConfirmDelete(null);
      await load();
    } catch (err: any) {
      alert(`Error deleting user: ${err.message}`);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Shield size={26} style={{ color: 'var(--primary-color)' }} /> Users Management
          </div>
          <div className="page-subtitle">{users.length} users registered · manage roles & permissions</div>
        </div>
        {canManage && (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-primary" onClick={openAdd}>
            <UserPlus size={18} /> Add User
          </motion.button>
        )}
      </div>

      {/* Search bar */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Search size={18} style={{ color: 'var(--text-muted)' }} />
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, username or role…"
          style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: '0.95rem', width: '100%' }}
        />
      </div>

      {/* Users Table */}
      <motion.div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>User</th>
                <th>Role</th>
                <th>Permissions</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last Login</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: 44, height: 44, border: '4px solid var(--border-color)', borderTop: '4px solid var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.95rem' }}>Loading users...</div>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <Users size={48} style={{ opacity: 0.2, margin: '0 auto 1rem', display: 'block', color: 'var(--primary-color)' }} />
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>No users found</div>
                  </td>
                </tr>
              ) : (
                filtered.map((u, i) => {
                  const rc = ROLE_COLORS[u.role] || ROLE_COLORS['Viewer'];
                  const permCount = Object.values(u.permissions).filter(Boolean).length;
                  const total = Object.keys(u.permissions).length;
                  return (
                    <tr key={u.id}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: 'var(--primary-gradient)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, color: 'white', fontSize: '1rem', flexShrink: 0,
                          }}>{u.fullName.charAt(0)}</div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{u.fullName}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.username || (u as any).email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ background: rc.bg, color: rc.text, padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700 }}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 80, height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${(permCount / total) * 100}%`, height: '100%', background: 'var(--primary-color)', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{permCount}/{total}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          background: u.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                          color: u.isActive ? '#10b981' : '#ef4444',
                          padding: '0.25rem 0.65rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700,
                        }}>{u.isActive ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {format(new Date(u.createdAt), 'dd MMM yyyy')}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {u.lastLogin ? format(new Date(u.lastLogin), 'dd MMM yyyy') : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          {canManage && (
                            <>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => openSessions(u)}
                                title="View Session History"
                                style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '0.5rem', cursor: 'pointer', color: 'var(--primary-color)' }}>
                                <Clock size={15} />
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => openEdit(u)}
                                title="Edit User"
                                style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '0.5rem', cursor: 'pointer', color: '#f59e0b' }}>
                                <Edit size={15} />
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => setConfirmDelete(u.id)}
                                disabled={u.id === 'super-admin-001'}
                                style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '0.5rem', cursor: u.id === 'super-admin-001' ? 'not-allowed' : 'pointer', color: '#ef4444', opacity: u.id === 'super-admin-001' ? 0.3 : 1 }}>
                                <Trash2 size={15} />
                              </motion.button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              className="glass-card"
              style={{ width: '100%', maxWidth: 680, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', padding: 0 }}>

              {/* Modal header */}
              <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {editingUser ? <Edit size={18} color="white" /> : <UserPlus size={18} color="white" />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>{editingUser ? 'Edit User' : 'Add New User'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manage access & permissions</div>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}>
                  <X size={22} />
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 1.75rem' }}>
                {(['info', 'permissions'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    style={{ padding: '0.9rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-muted)', borderBottom: activeTab === tab ? '2px solid var(--primary-color)' : '2px solid transparent', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {tab === 'info' ? <Users size={15} /> : <Key size={15} />}
                    {tab === 'info' ? 'User Info' : 'Permissions'}
                  </button>
                ))}
              </div>

              {/* Modal body */}
              <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
                {activeTab === 'info' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Full Name */}
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>Full Name *</label>
                      <input className="form-input" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="e.g. Ahmed Abdi" />
                    </div>
                    {/* Username */}
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>Username *</label>
                      <input className="form-input" type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="e.g. ahmed" />
                    </div>
                    {/* Password */}
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>Password *</label>
                      <div style={{ position: 'relative' }}>
                        <input className="form-input" type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Set a password" style={{ paddingRight: '3rem' }} />
                        <button type="button" onClick={() => setShowPw(p => !p)}
                          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                          {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    {/* Role */}
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>Role</label>
                      <input
                        className="form-input"
                        value={form.role}
                        onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                        placeholder="e.g. Viewer, Admin, Officer…"
                        style={{ marginBottom: '0.6rem' }}
                      />
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick-fill:</div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {ROLE_SUGGESTIONS.map(r => {
                          const rc = ROLE_COLORS[r] || { bg: 'rgba(100,116,139,0.15)', text: '#64748b' };
                          const selected = form.role === r;
                          return (
                            <button key={r} type="button" onClick={() => handleRoleChange(r)}
                              style={{ padding: '0.35rem 0.85rem', borderRadius: 20, border: selected ? `2px solid ${rc.text}` : '1px solid var(--border-color)', background: selected ? rc.bg : 'var(--bg-main)', color: selected ? rc.text : 'var(--text-muted)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                              {r}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Clicking a suggestion fills the role and auto-sets default permissions</div>
                    </div>
                    {/* Status */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-main)', padding: '1rem', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Account Status</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{form.isActive ? 'User can log in' : 'User is blocked'}</div>
                      </div>
                      <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                        style={{ width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: form.isActive ? '#10b981' : 'var(--border-color)', transition: 'all 0.3s', position: 'relative' }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 4, left: form.isActive ? 26 : 4, transition: 'all 0.3s' }} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Toggle individual permissions for this user</div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" className="btn-secondary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                          onClick={() => setPermissions(buildDefaultPermissions(form.role))}>Reset to Role</button>
                        <button type="button" className="btn-secondary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                          onClick={() => {
                            const all = {} as Permission;
                            (Object.keys(permissions) as (keyof Permission)[]).forEach(k => (all[k] = true));
                            setPermissions(all);
                          }}>Grant All</button>
                        <button type="button" className="btn-secondary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                          onClick={() => setPermissions(emptyPermission())}>Revoke All</button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {PERMISSION_GROUPS.map(g => (
                        <div key={g.group} style={{ background: 'var(--bg-main)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                          <div style={{ padding: '0.65rem 1rem', background: 'var(--border-color)', fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                            {g.group}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
                            {g.keys.map(({ key, label }) => {
                              const val = permissions[key as keyof Permission];
                              return (
                                <div key={key}
                                  onClick={() => togglePerm(key as keyof Permission)}
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s', userSelect: 'none' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card)')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                  <span style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 500 }}>{label}</span>
                                  <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${val ? 'var(--primary-color)' : 'var(--border-color)'}`, background: val ? 'var(--primary-color)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                                    {val && <Check size={13} color="white" strokeWidth={3} />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div style={{ padding: '1.25rem 1.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleSave}
                  disabled={!form.fullName.trim() || !form.username.trim() || !form.password.trim()}>
                  <Check size={16} /> {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              className="glass-card" style={{ padding: '2.5rem', maxWidth: 440, width: '100%', textAlign: 'center', background: 'var(--bg-card)' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <AlertTriangle size={32} style={{ color: '#ef4444' }} />
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>Delete User?</div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
                This will permanently remove the user account and all their access permissions.
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Cancel</button>
                <button className="btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(confirmDelete)}>Delete User</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session History Modal */}
      <AnimatePresence>
        {viewSessionsUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              className="glass-card"
              style={{ width: '100%', maxWidth: 800, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', padding: 0 }}>
              
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={18} color="white" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>Session History</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{viewSessionsUser.fullName}</div>
                  </div>
                </div>
                <button onClick={() => setViewSessionsUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}>
                  <X size={22} />
                </button>
              </div>

              <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Device</th>
                        <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>System</th>
                        <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Login Time</th>
                        <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Logout Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userSessions.map((s, i) => (
                        <tr key={s.id || i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, color: 'var(--text-main)' }}>
                              {s.deviceType === 'Mobile' ? <Smartphone size={16} /> : s.deviceType === 'Tablet' ? <Tablet size={16} /> : <Monitor size={16} />}
                              {s.deviceType}
                            </div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{s.browser}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.os}</div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{new Date(s.loginTime).toLocaleString()}</div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {s.logoutTime ? (
                              <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{new Date(s.logoutTime).toLocaleString()}</div>
                            ) : (
                              <span style={{ padding: '0.2rem 0.6rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>Active</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {userSessions.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No sessions recorded for this user.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
