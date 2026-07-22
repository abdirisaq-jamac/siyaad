import React, { useState, useEffect } from 'react';
import { FileBarChart2, Calendar, Users, MapPin, Download } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { getCitizens } from '../services/storage';
import type { Citizen } from '../types';
import { format, isThisMonth, isThisYear, isToday, getYear } from 'date-fns';

type Tab = 'daily' | 'monthly' | 'yearly' | 'gender' | 'district';

function buildDailyData(citizens: Citizen[]) {
  const map: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    map[format(d, 'EEE dd')] = 0;
  }
  citizens.forEach(c => {
    const key = format(new Date(c.registrationDate), 'EEE dd');
    if (key in map) map[key]++;
  });
  return Object.entries(map).map(([day, count]) => ({ day, count }));
}

function buildMonthlyData(citizens: Citizen[]) {
  const map: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    map[format(d, 'MMM yy')] = 0;
  }
  citizens.forEach(c => {
    const key = format(new Date(c.registrationDate), 'MMM yy');
    if (key in map) map[key]++;
  });
  return Object.entries(map).map(([month, count]) => ({ month, count }));
}

function buildYearlyData(citizens: Citizen[]) {
  const map: Record<string, number> = {};
  citizens.forEach(c => {
    const yr = String(getYear(new Date(c.registrationDate)));
    map[yr] = (map[yr] || 0) + 1;
  });
  return Object.entries(map).sort().map(([year, count]) => ({ year, count }));
}

function buildGenderData(citizens: Citizen[]) {
  const male = citizens.filter(c => c.gender === 'Male').length;
  const female = citizens.filter(c => c.gender === 'Female').length;
  return [
    { name: 'Male', value: male, color: '#2563eb' },
    { name: 'Female', value: female, color: '#00875a' },
  ];
}

function buildDistrictData(citizens: Citizen[]) {
  const map: Record<string, number> = {};
  citizens.forEach(c => { map[c.district] = (map[c.district] || 0) + 1; });
  return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([district, count]) => ({ district, count }));
}

function SummaryCard({ label, value, icon, color }: { label: string; value: number | string; icon: React.ReactNode; color: string }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#8b9bb4', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color, marginTop: '0.25rem' }}>{value}</div>
        </div>
        <div style={{ color, background: `${color}22`, borderRadius: 10, padding: '0.6rem' }}>{icon}</div>
      </div>
    </div>
  );
}

export default function Reports() {
  const [tab, setTab] = useState<Tab>('monthly');
  const [citizens, setCitizens] = useState<Citizen[]>([]);

  useEffect(() => { getCitizens().then(setCitizens).catch(console.error); }, []);

  const todayCount = citizens.filter(c => isToday(new Date(c.registrationDate))).length;
  const monthCount = citizens.filter(c => isThisMonth(new Date(c.registrationDate))).length;
  const yearCount = citizens.filter(c => isThisYear(new Date(c.registrationDate))).length;
  const maleCount = citizens.filter(c => c.gender === 'Male').length;
  const femaleCount = citizens.filter(c => c.gender === 'Female').length;

  const TOOLTIP_STYLE = { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#1e293b' };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'daily', label: '📅 Daily' },
    { key: 'monthly', label: '📆 Monthly' },
    { key: 'yearly', label: '📈 Yearly' },
    { key: 'gender', label: '👥 Gender' },
    { key: 'district', label: '📍 District' },
  ];

  function exportReport() {
    const data = citizens.map(c => ({
      'National ID': c.nationalIdNumber, 'Name': c.fullName,
      'Gender': c.gender, 'District': c.district,
      'Status': c.status, 'Registered': c.registrationDate,
    }));
    const csv = [Object.keys(data[0] || {}), ...data.map(r => Object.values(r))].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `report_${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
  }

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <div>
          <div className="page-title">Reports & Analytics</div>
          <div className="page-subtitle">Comprehensive system reports and statistics</div>
        </div>
        <button className="btn-primary" onClick={exportReport}>
          <Download size={16} /> Export Report
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <SummaryCard label="Today" value={todayCount} icon={<Calendar size={20} />} color="#c8a84b" />
        <SummaryCard label="This Month" value={monthCount} icon={<Calendar size={20} />} color="#2563eb" />
        <SummaryCard label="This Year" value={yearCount} icon={<FileBarChart2 size={20} />} color="#00875a" />
        <SummaryCard label="Total Citizens" value={citizens.length} icon={<Users size={20} />} color="#00a36c" />
        <SummaryCard label="Male" value={maleCount} icon={<Users size={20} />} color="#2563eb" />
        <SummaryCard label="Female" value={femaleCount} icon={<Users size={20} />} color="#e91e63" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '0.5rem 1.2rem', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              background: tab === t.key ? 'linear-gradient(135deg,#00875a,#2563eb)' : '#f8fafc',
              color: tab === t.key ? 'white' : '#8b9bb4',
              border: tab === t.key ? 'none' : '1px solid #e2e8f0',
              transition: 'all 0.2s',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Chart */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        {tab === 'daily' && (
          <>
            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>Daily Registrations (Last 7 Days)</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={buildDailyData(citizens)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#8b9bb4" tick={{ fontSize: 12 }} />
                <YAxis stroke="#8b9bb4" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#00875a" radius={[4,4,0,0]} name="Registrations" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {tab === 'monthly' && (
          <>
            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>Monthly Registrations (Last 12 Months)</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={buildMonthlyData(citizens)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#8b9bb4" tick={{ fontSize: 11 }} />
                <YAxis stroke="#8b9bb4" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="count" stroke="#00875a" strokeWidth={3} dot={{ fill: '#00875a', r: 5 }} name="Registrations" />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}

        {tab === 'yearly' && (
          <>
            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>Yearly Registrations</div>
            {buildYearlyData(citizens).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={buildYearlyData(citizens)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" stroke="#8b9bb4" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#8b9bb4" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" fill="#2563eb" radius={[4,4,0,0]} name="Registrations" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b9bb4' }}>
                No yearly data yet
              </div>
            )}
          </>
        )}

        {tab === 'gender' && (
          <>
            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>Gender Distribution</div>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <ResponsiveContainer width={300} height={300}>
                <PieChart>
                  <Pie data={buildGenderData(citizens)} cx="50%" cy="50%" outerRadius={110} dataKey="value" label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                    {buildGenderData(citizens).map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend formatter={v => <span style={{ color: '#c8d8f0', fontSize: 13 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 8, border: '1px solid rgba(26,74,138,0.3)' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#2563eb' }}>{maleCount}</div>
                  <div style={{ color: '#8b9bb4', fontSize: '0.85rem' }}>Male Citizens</div>
                  <div style={{ color: '#8b9bb4', fontSize: '0.75rem' }}>
                    {citizens.length ? ((maleCount/citizens.length)*100).toFixed(1) : 0}%
                  </div>
                </div>
                <div style={{ padding: '1rem', background: 'rgba(0,135,90,0.15)', borderRadius: 8, border: '1px solid rgba(0,135,90,0.3)' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#00875a' }}>{femaleCount}</div>
                  <div style={{ color: '#8b9bb4', fontSize: '0.85rem' }}>Female Citizens</div>
                  <div style={{ color: '#8b9bb4', fontSize: '0.75rem' }}>
                    {citizens.length ? ((femaleCount/citizens.length)*100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'district' && (
          <>
            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>Citizens by District</div>
            {buildDistrictData(citizens).length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={buildDistrictData(citizens)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#8b9bb4" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="district" stroke="#8b9bb4" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="count" fill="#00875a" radius={[0,4,4,0]} name="Citizens" />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead><tr><th>#</th><th>District</th><th>Count</th><th>% Share</th></tr></thead>
                    <tbody>
                      {buildDistrictData(citizens).map((d, i) => (
                        <tr key={d.district}>
                          <td style={{ color: '#8b9bb4' }}>{i+1}</td>
                          <td><MapPin size={14} style={{ color: '#00875a', marginRight: 6 }} />{d.district}</td>
                          <td style={{ fontWeight: 700, color: '#00a36c' }}>{d.count}</td>
                          <td style={{ color: '#8b9bb4' }}>{citizens.length ? ((d.count/citizens.length)*100).toFixed(1) : 0}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b9bb4' }}>
                No district data yet
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
