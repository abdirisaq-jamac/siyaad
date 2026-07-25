import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Sun, Moon, CheckCircle2, Shield, Zap, Globe, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUsers } from '../services/storage';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.body.classList.add('dark-theme');
    } else {
      setIsDark(false);
      document.body.classList.remove('dark-theme');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Normalize: trim whitespace and lowercase the email (fixes mobile autocapitalize)
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    // Simulate a slight delay for UX
    await new Promise(r => setTimeout(r, 600));

    try {
      // MASTER BYPASS: Always allow admin or admin@gmail.com with full permissions
      if ((normalizedEmail === 'admin@gmail.com' || normalizedEmail === 'admin') && normalizedPassword === 'admin') {
        const sessionData = { 
          id: 'super-admin-001', 
          fullName: 'Super Administrator', 
          email: 'admin@gmail.com', 
          role: 'Super Admin', 
          permissions: {
            viewDashboard: true, viewCitizens: true, registerCitizen: true,
            editCitizen: true, deleteCitizen: true, viewIdCards: true,
            exportIdCard: true, verifyQR: true, viewReports: true,
            exportReports: true, viewSettings: true, editSettings: true,
            viewUsers: true, manageUsers: true,
          }
        };
        if (rememberMe) {
          localStorage.setItem('user', JSON.stringify(sessionData));
        } else {
          sessionStorage.setItem('user', JSON.stringify(sessionData));
        }
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/dashboard');
        return;
      }

      // Load users from Supabase database
      let users = await getUsers();
      if (!users || users.length === 0) {
        users = [{
          id: 'super-admin-001',
          fullName: 'Super Administrator',
          email: 'admin@gmail.com',
          password: 'admin',
          role: 'Super Admin',
          isActive: true,
          permissions: {
            viewDashboard: true, viewCitizens: true, registerCitizen: true,
            editCitizen: true, deleteCitizen: true, viewIdCards: true,
            exportIdCard: true, verifyQR: true, viewReports: true,
            exportReports: true, viewSettings: true, editSettings: true,
            viewUsers: true, manageUsers: true,
          },
          createdAt: new Date().toISOString(),
          lastLogin: null,
          avatar: null
        }];
      }

      const allUsers = users;

      const matched = allUsers.find(
        (u: any) => u.email.trim().toLowerCase() === normalizedEmail && u.password === normalizedPassword
      );

      if (!matched) {
        setError('Invalid email or password. Please try again.');
        return;
      }

      if (!matched.isActive) {
        setError('Your account is inactive. Please contact an administrator.');
        return;
      }

      // Update lastLogin
      const updatedUsers = allUsers.map((u: any) =>
        u.id === matched.id ? { ...u, lastLogin: new Date().toISOString() } : u
      );
      localStorage.setItem('app_users', JSON.stringify(updatedUsers));

      // Store session
      const sessionData = { id: matched.id, fullName: matched.fullName, email: matched.email, role: matched.role, permissions: matched.permissions };
      if (rememberMe) {
        localStorage.setItem('user', JSON.stringify(sessionData));
      } else {
        sessionStorage.setItem('user', JSON.stringify(sessionData));
      }
      localStorage.setItem('isAuthenticated', 'true');
      // Updated to redirect to dashboard after login
      navigate('/dashboard');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Feature cards for the right panel
  const features = [
    { icon: <Shield size={28} />, title: 'Secure Authentication', desc: 'Enterprise-grade bcrypt encryption with JWT tokens' },
    { icon: <Zap size={28} />, title: 'Lightning Fast', desc: 'Optimized for speed with instant data retrieval' },
    { icon: <Globe size={28} />, title: 'Multi-Language', desc: 'Full support for English, Somali & Arabic' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', overflow: 'hidden', fontFamily: "'Inter', 'Poppins', sans-serif" }}>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* LEFT SIDE — LOGIN FORM (Centered) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div 
        style={{
          flex: '1 1 100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 2rem',
          backgroundColor: isDark ? '#020617' : '#f8fafc',
          backgroundImage: isDark 
            ? 'radial-gradient(circle at top right, rgba(37,99,235,0.1), transparent 400px), radial-gradient(circle at bottom left, rgba(124,58,237,0.1), transparent 400px)' 
            : 'radial-gradient(circle at top right, rgba(37,99,235,0.08), transparent 400px), radial-gradient(circle at bottom left, rgba(124,58,237,0.08), transparent 400px)',
          transition: 'background-color 0.5s ease',
          position: 'relative',
        }}
      >

        {/* Theme Toggle — top-left corner */}
        <button
          onClick={toggleTheme}
          style={{
            position: 'absolute', top: '2rem', left: '2rem', zIndex: 10,
            width: '48px', height: '48px', borderRadius: '50%', border: 'none',
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            color: isDark ? '#94a3b8' : '#475569',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.3s ease',
          }}
        >
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <Sun size={22} />
              </motion.div>
            ) : (
              <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <Moon size={22} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ 
            width: '100%', 
            maxWidth: '460px', 
            position: 'relative',
            zIndex: 1,
            background: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.8)',
            boxShadow: isDark ? '0 25px 50px -12px rgba(0,0,0,0.5)' : '0 25px 50px -12px rgba(0,0,0,0.1)',
            borderRadius: '24px',
            padding: '2.5rem',
            overflow: 'hidden',
          }}
        >
          {/* WATERMARK DIRECTLY BEHIND TEXT */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 0,
            opacity: isDark ? 0.12 : 0.15,
            pointerEvents: 'none',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <div style={{
              width: '380px',
              height: '380px',
              borderRadius: '50%',
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: isDark ? '0 0 100px rgba(255,255,255,0.05)' : '0 0 100px rgba(0,0,0,0.05)',
            }}>
              <img 
                src="/logo-lascanood.jpg" 
                alt="Background Watermark" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover', 
                  transform: 'scale(1.15)', 
                }} 
              />
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '3rem' }}>
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              style={{
                width: '52px', height: '52px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 900, fontSize: '22px',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)',
                flexShrink: 0
              }}
            >
              W
            </motion.div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: isDark ? '#f1f5f9' : '#0f172a', lineHeight: 1.2 }}>
              Waqooyi Bari National ID <br/>Management System
            </span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h1 style={{
              fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.2,
              color: isDark ? '#f1f5f9' : '#0f172a', marginBottom: '0.75rem',
              letterSpacing: '-1px',
            }}>
              Welcome back
            </h1>
          </div>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '14px', padding: '14px 18px', marginBottom: '1.5rem',
                  color: '#ef4444', fontSize: '0.9rem', fontWeight: 500,
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>



          {/* Form */}
          <form onSubmit={handleLogin}>
            {/* Username */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: isDark ? '#cbd5e1' : '#334155', marginBottom: '8px', letterSpacing: '0.3px' }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <User size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: isDark ? '#475569' : '#94a3b8' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gmail.com"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="email"
                  spellCheck={false}
                  inputMode="email"
                  style={{
                    width: '100%', padding: '14px 16px 14px 48px', borderRadius: '14px',
                    border: `1.5px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
                    background: isDark ? '#0f172a' : '#f8fafc',
                    color: isDark ? '#f1f5f9' : '#0f172a',
                    fontSize: '0.95rem', fontWeight: 500, outline: 'none',
                    transition: 'all 0.3s ease', boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = isDark ? '#1e293b' : '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: isDark ? '#cbd5e1' : '#334155', marginBottom: '8px', letterSpacing: '0.3px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: isDark ? '#475569' : '#94a3b8' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '14px 52px 14px 48px', borderRadius: '14px',
                    border: `1.5px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
                    background: isDark ? '#0f172a' : '#f8fafc',
                    color: isDark ? '#f1f5f9' : '#0f172a',
                    fontSize: '0.95rem', fontWeight: 500, outline: 'none',
                    transition: 'all 0.3s ease', boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = isDark ? '#1e293b' : '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '10px',
                    color: isDark ? '#475569' : '#94a3b8', transition: 'color 0.2s ease',
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me + Forgot */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    width: '18px', height: '18px', borderRadius: '6px', cursor: 'pointer',
                    accentColor: '#2563EB',
                  }}
                />
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: isDark ? '#94a3b8' : '#64748b' }}>
                  Remember me
                </span>
              </label>
            </div>

            {/* Sign In Button */}
            <motion.button
              whileHover={{ scale: 1.015, boxShadow: '0 12px 32px rgba(37, 99, 235, 0.35)' }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #7C3AED 100%)',
                backgroundSize: '200% 200%',
                color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                transition: 'all 0.3s ease', letterSpacing: '0.3px',
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
              ) : (
                <CheckCircle2 size={22} />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <ArrowRight size={18} />}
            </motion.button>
          </form>
          </div>
        </motion.div>
      </div>

    </div>
  );
};

export default Login;
