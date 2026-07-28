import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, UserPlus, CreditCard, QrCode,
  FileBarChart2, Settings as SettingsIcon, ChevronLeft, ChevronRight,
  Bell, LogOut, Sun, Moon, UserCog, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import { getSettings } from '../services/storage';
import type { AppSettings } from '../types';

// ── Module-level settings cache — fetched only ONCE across all components ──
let _settingsCache: AppSettings | null = null;
let _settingsFetching: Promise<AppSettings> | null = null;

function getCachedSettings(): Promise<AppSettings> {
  if (_settingsCache) return Promise.resolve(_settingsCache);
  if (_settingsFetching) return _settingsFetching;
  _settingsFetching = getSettings().then(s => {
    _settingsCache = s;
    _settingsFetching = null;
    return s;
  });
  return _settingsFetching;
}

function invalidateSettingsCache() {
  _settingsCache = null;
  _settingsFetching = null;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  required: string;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    getCachedSettings().then(setSettings).catch(console.error);

    const handleSettingsUpdate = () => {
      invalidateSettingsCache();
      getCachedSettings().then(setSettings).catch(console.error);
    };
    window.addEventListener('settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('settings-updated', handleSettingsUpdate);
  }, []);

  // Read permissions from session
  const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
  const userPerms = rawUser ? JSON.parse(rawUser)?.permissions : null;

  const navItems: NavItem[] = [
    { label: t('Dashboard'),        path: '/',                icon: <LayoutDashboard size={18} />, required: 'viewDashboard' },
    { label: t('Register Citizen'), path: '/register',        icon: <UserPlus size={18} />, required: 'registerCitizen' },
    { label: t('Citizens List'),    path: '/citizens',        icon: <Users size={18} />, required: 'viewCitizens' },
    { label: t('ID Card Preview'),  path: '/id-cards',        icon: <CreditCard size={18} />, required: 'viewIdCards' },
    { label: t('QR Verification'),  path: '/qr-verify',       icon: <QrCode size={18} />, required: 'verifyQR' },
    { label: t('Reports'),          path: '/reports',         icon: <FileBarChart2 size={18} />, required: 'viewReports' },
    { label: t('Users'),            path: '/users',           icon: <UserCog size={18} />, required: 'viewUsers' },
    { label: t('Settings'),         path: '/settings',        icon: <SettingsIcon size={18} />, required: 'viewSettings' },
  ].filter(item => !userPerms || userPerms[item.required]);

  return (
    <motion.aside
      className="no-print"
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        minHeight: '100vh',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {/* Logo */}
      <div style={{
        padding: collapsed ? '1.5rem 0' : '1.5rem 1.25rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        justifyContent: collapsed ? 'center' : 'flex-start',
        background: 'var(--bg-sidebar)',
      }}>
        <motion.div 
          whileHover={{ scale: 1.05, rotate: 5 }}
          style={{
            width: 48, height: 48,
            background: 'white',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
            border: '2px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <img src={settings?.logoUrl || "/logo.jpg"} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </motion.div>
        
        <AnimatePresence>
          {!collapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>
                {settings?.stateName || 'Waqooyi Bari'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: 500 }}>
                National ID System
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggle}
        style={{
          position: 'absolute',
          top: '2rem',
          right: -12,
          background: 'var(--primary-color)',
          border: '2px solid var(--bg-card)',
          borderRadius: '50%',
          color: 'white',
          cursor: 'pointer',
          width: 28, height: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 101,
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </motion.button>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '1.5rem 0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {!collapsed && (
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 0.75rem', marginBottom: '0.75rem' }}>
            {t('Main Menu')}
          </div>
        )}
        {navItems.map((item, i) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            style={{ justifyContent: collapsed ? 'center' : 'flex-start', paddingLeft: collapsed ? 0 : undefined }}
            title={collapsed ? item.label : undefined}
          >
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              {item.icon}
            </motion.div>
            
            <AnimatePresence>
              {!collapsed && (
                <motion.span 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>


    </motion.aside>
  );
}

interface TopbarProps {
  sidebarCollapsed: boolean;
  onMobileMenu: () => void;
}

export function Topbar({ sidebarCollapsed, onMobileMenu }: TopbarProps) {
  const location = useLocation();
  const { t } = useTranslation();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

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

  // Notifications are loaded lazily — only when the bell is clicked, not on every page load
  // This avoids fetching all citizens on every refresh just for the topbar badge
  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    getCachedSettings().then(setSettings).catch(console.error);
    const handleSettingsUpdate = () => {
      invalidateSettingsCache();
      getCachedSettings().then(setSettings).catch(console.error);
    };
    window.addEventListener('settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('settings-updated', handleSettingsUpdate);
  }, []);
  
  const routeLabels: Record<string, string> = {
    '/': t('Dashboard'),
    '/register': t('Register Citizen'),
    '/citizens': t('Citizens List'),
    '/id-cards': t('ID Card Preview'),
    '/qr-verify': t('QR Verification'),
    '/reports': t('Reports'),
    '/settings': t('Settings'),
  };
  const getLabel = () => {
    if (location.pathname.startsWith('/citizens/')) return t('Citizen Details');
    return routeLabels[location.pathname] || t('Dashboard');
  };

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return document.body.classList.contains('dark-theme');
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear authentication flags
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    // Optionally clear any user‑specific data
    localStorage.removeItem('user');
    // Redirect to login page
    navigate('/login');
  };

  return (
    <header
      className="no-print bg-glass"
      style={{
        height: 72,
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.5rem',
        gap: '1.25rem',
        position: 'relative', // Changed from sticky to relative so it doesn't follow on scroll
        zIndex: 50,
      }}
    >

      <div>
        <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          {getLabel()}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'white', fontWeight: 700, letterSpacing: '0.02em' }}>
          {settings?.stateName || 'Waqooyi Bari'} National ID Management System
        </div>
      </div>
      <div style={{ flex: 1 }} />
      

      
      {/* Notifications */}
      <div ref={notificationsRef} style={{ position: 'relative' }}>
        <motion.button 
          onClick={() => setShowNotifications(!showNotifications)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ 
            background: showNotifications ? 'rgba(37, 99, 235, 0.1)' : 'var(--bg-main)', 
            border: '1px solid var(--border-color)', 
            cursor: 'pointer', 
            color: showNotifications ? 'var(--primary-color)' : 'var(--text-muted)', 
            position: 'relative',
            width: 40, height: 40,
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -2, right: -2,
              background: '#ef4444', color: 'white',
              borderRadius: '50%', width: 18, height: 18,
              fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700,
              boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)',
              border: '2px solid var(--bg-card)'
            }}>{unreadCount}</span>
          )}
        </motion.button>

        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute',
                top: 'calc(100% + 12px)',
                right: -80,
                width: 320,
                background: 'var(--bg-card)',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                zIndex: 1000
              }}
            >
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)' }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>Notifications</div>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} style={{ fontSize: '0.75rem', color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    Mark all as read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No notifications right now.</div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      onClick={() => {
                        setShowNotifications(false);
                        navigate(`/id-cards/${notif.id}`);
                      }}
                      style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '0.75rem', background: notif.unread ? 'rgba(37,99,235,0.03)' : 'transparent', transition: 'background 0.2s', cursor: 'pointer' }} 
                      className="hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <div style={{ marginTop: '0.1rem' }}>
                        {notif.type === 'info' && <Users size={16} color="#3b82f6" />}
                        {notif.type === 'success' && <CheckCircle2 size={16} color="#10b981" />}
                        {notif.type === 'warning' && <AlertCircle size={16} color="#f59e0b" />}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: notif.unread ? 700 : 600, color: 'var(--text-main)', marginBottom: '0.15rem' }}>{notif.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', lineHeight: 1.4 }}>{notif.desc}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          <Clock size={10} /> {getRelativeTime(notif.time)}
                        </div>
                      </div>
                      {notif.unread && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', alignSelf: 'center', marginLeft: 'auto' }} />
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Theme Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border-color)' }}>
        <motion.button 
          whileHover={{ scale: 1.05, rotate: isDark ? -15 : 15 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          style={{ 
            background: isDark ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-main)',
            border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.2)' : 'var(--border-color)'}`,
            borderRadius: '12px',
            width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: isDark ? '#f59e0b' : 'var(--text-muted)',
            transition: 'all 0.3s ease',
            boxShadow: isDark ? '0 0 15px rgba(245, 158, 11, 0.2)' : 'var(--shadow-sm)'
          }}
          title="Toggle Dark/Light Mode"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </motion.button>

        {/* Logout Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            marginRight: '0.5rem',
          }}
          title="Logout"
        >
          <LogOut size={20} />
        </motion.button>
        
        {/* User Profile */}
        <div style={{ marginLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.25rem', borderRadius: '12px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>
            {(() => {
              const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
              const userName = rawUser ? JSON.parse(rawUser)?.fullName || 'Admin' : 'Admin';
              return userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
            })()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {(() => {
                const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
                return rawUser ? JSON.parse(rawUser)?.fullName || 'Admin' : 'Admin';
              })()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
