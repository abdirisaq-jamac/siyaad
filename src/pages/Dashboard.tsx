import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, CreditCard, Clock, CheckCircle, TrendingUp,
  UserPlus, ArrowUpRight, Activity, BarChart3
} from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid, XAxis, YAxis, BarChart, Bar } from 'recharts';
import { getCitizens } from '../services/storage';
import type { Citizen } from '../types';
import { format } from 'date-fns';
import { useTranslation } from '../i18n';

function buildMonthlyData(citizens: Citizen[]) {
  const months: Record<string, number> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = format(d, 'MMM yy');
    months[key] = 0;
  }
  citizens.forEach(c => {
    const d = new Date(c.registrationDate);
    const key = format(d, 'MMM yy');
    if (key in months) months[key]++;
  });
  return Object.entries(months).map(([month, count]) => ({ month, count }));
}

function buildGenderData(citizens: Citizen[]) {
  const male = citizens.filter(c => c.gender === 'Male').length;
  const female = citizens.filter(c => c.gender === 'Female').length;
  return [
    { name: 'Male', value: male, color: '#3b82f6' },
    { name: 'Female', value: '#10b981', color: '#10b981' }, // Used for pie chart
  ];
}

function buildDistrictData(citizens: Citizen[]) {
  const map: Record<string, number> = {};
  citizens.forEach(c => { map[c.district] = (map[c.district] || 0) + 1; });
  return Object.entries(map).map(([district, count]) => ({ district, count })).slice(0, 6);
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.3 }
  }
};

export default function Dashboard() {
  const { t } = useTranslation();
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getCitizens().then(setCitizens).catch(console.error);
    
    // Retrieve user from storage
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.name) {
          setUserName(user.name);
        }
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

  const total = citizens.length;
  const approved = citizens.filter(c => c.status === 'Active').length;
  const pending = citizens.filter(c => c.status === 'Pending').length;
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayCount = citizens.filter(c => c.registrationDate === today).length;

  const monthlyData = buildMonthlyData(citizens);
  const genderData = [
    { name: 'Male', value: citizens.filter(c => c.gender === 'Male').length, color: '#3b82f6' },
    { name: 'Female', value: citizens.filter(c => c.gender === 'Female').length, color: '#10b981' },
  ];
  const districtData = buildDistrictData(citizens);

  const recent = [...citizens].sort((a, b) =>
    new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()
  ).slice(0, 5);

  const stats = [
    { label: t('Total Citizens'), value: total, icon: <Users size={24} />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
    { label: t('Total ID Cards'), value: approved, icon: <CreditCard size={24} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
    { label: t('Pending Applications'), value: pending, icon: <Clock size={24} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
    { label: t('Approved'), value: approved, icon: <CheckCircle size={24} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
    { label: t("Today's Registrations"), value: todayCount, icon: <Activity size={24} />, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
  ];

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="page-header">
        <div>
          <div className="page-title">{t('Dashboard Overview')}</div>
          <div className="page-subtitle">
            {userName ? `Welcome back, ${userName}!` : t('Welcome to Waqooyi Bari National ID Management System')}
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn-primary" 
          onClick={() => navigate('/register')}
        >
          <UserPlus size={18} /> {t('Register Citizen')}
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {stats.map((s, i) => (
          <motion.div 
            key={i} 
            className="stat-card"
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: s.color, lineHeight: 1.2, marginTop: '0.5rem' }}>
                  {s.value}
                </div>
              </div>
              <div style={{ background: s.bg, borderRadius: '12px', padding: '0.75rem', color: s.color }}>
                {s.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Area Chart */}
        <div className="glass-card" style={{ padding: '1.5rem', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>{t('Registration Trends')}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Last 6 months</div>
            </div>
            <div style={{ padding: '0.5rem', background: 'var(--bg-main)', borderRadius: '8px' }}>
              <TrendingUp size={20} style={{ color: 'var(--primary-color)' }} />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-main)', boxShadow: 'var(--shadow-md)' }} 
                itemStyle={{ color: 'var(--primary-color)', fontWeight: 700 }}
              />
              <Area type="monotone" dataKey="count" stroke="var(--primary-color)" fill="url(#colorRegistrations)" strokeWidth={3} name="Registrations" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{t('Gender Distribution')}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Citizens by gender</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={genderData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} dataKey="value" paddingAngle={5}>
                {genderData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
              </Pie>
              <Tooltip 
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-main)' }} 
                itemStyle={{ fontWeight: 700 }}
              />
              <Legend formatter={(v) => <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{v}</span>} verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Bar + Recent */}
      <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* District Bar */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{t('Citizens by District')}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Top districts</div>
          {districtData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={districtData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-color)" />
                <XAxis type="number" stroke="var(--text-muted)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="district" stroke="var(--text-main)" tick={{ fontSize: 12, fontWeight: 600 }} width={90} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'var(--bg-sidebar-hover)' }}
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-main)' }} 
                />
                <Bar dataKey="count" fill="var(--primary-color)" radius={[0, 6, 6, 0]} name="Citizens" barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontWeight: 500 }}>
              No district data yet
            </div>
          )}
        </div>

        {/* Recent Registrations */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>{t('Recent Registrations')}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Latest citizens</div>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-secondary" 
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }} 
              onClick={() => navigate('/citizens')}
            >
              {t('View All')} <ArrowUpRight size={14} />
            </motion.button>
          </div>
          {recent.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0' }}>
              <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
              <div style={{ fontWeight: 500 }}>No citizens registered yet</div>
              <button className="btn-primary" style={{ marginTop: '1.5rem', fontSize: '0.85rem' }} onClick={() => navigate('/register')}>
                <UserPlus size={16} /> Register First Citizen
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recent.map((c, idx) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => navigate(`/citizens/${c.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '0.85rem', borderRadius: '12px', cursor: 'pointer',
                    background: 'var(--bg-main)', border: '1px solid var(--border-color)',
                    transition: 'border-color 0.2s',
                  }}
                  className="hover:border-blue-500"
                >
                  {c.photo ? (
                    <img src={c.photo} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)', padding: '2px', background: 'var(--bg-card)' }} />
                  ) : (
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: 'var(--primary-gradient)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '1.1rem', color: 'white',
                      boxShadow: '0 2px 10px rgba(37, 99, 235, 0.3)'
                    }}>{c.fullName.charAt(0)}</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{c.fullName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem', fontWeight: 500 }}>{c.nationalIdNumber}</div>
                  </div>
                  <span className={c.status === 'Active' ? 'badge-active' : c.status === 'Pending' ? 'badge-pending' : 'badge-rejected'}>
                    {c.status}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
