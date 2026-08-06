import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle, XCircle, Shield, User, Calendar, MapPin, Phone,
  Briefcase, Heart, Hash, Home, UserCheck, Clock, AlertCircle
} from 'lucide-react';
import { getCitizenByNationalId } from '../services/storage';
import type { Citizen } from '../types';
import { format, isValid } from 'date-fns';
import { useTranslation } from '../i18n';

function safeFormat(dateStr: string, formatStr: string) {
  try {
    const d = new Date(dateStr);
    return isValid(d) ? format(d, formatStr) : 'Unknown Date';
  } catch {
    return 'Unknown Date';
  }
}

interface FieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoField({ icon, label, value }: FieldProps) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: '0.85rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.35rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
        {icon} {label}
      </div>
      <div style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem', wordBreak: 'break-word' }}>{value || '—'}</div>
    </div>
  );
}

export default function PublicVerify() {
  const { nationalId } = useParams<{ nationalId: string }>();
  const { t, language, setLanguage } = useTranslation();
  const [citizen, setCitizen] = useState<Citizen | null | 'not-found'>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!nationalId) { setCitizen('not-found'); setLoading(false); return; }
    getCitizenByNationalId(decodeURIComponent(nationalId).toUpperCase())
      .then(c => setCitizen(c ?? 'not-found'))
      .catch(() => setCitizen('not-found'))
      .finally(() => setLoading(false));
  }, [nationalId]);

  const isActive = citizen && citizen !== 'not-found' && citizen.status === 'Active';
  const isPending = citizen && citizen !== 'not-found' && citizen.status === 'Pending';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '2rem 1rem', fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header with Language Switcher */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative', width: '100%', maxWidth: 640 }}>
        
        <div style={{ position: 'absolute', right: 0, top: 0 }}>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value as 'en' | 'so' | 'ar')}
            style={{ 
              background: 'rgba(255,255,255,0.18)', color: 'white', border: '1px solid rgba(255,255,255,0.35)', 
              borderRadius: 8, padding: '0.4rem 0.6rem', fontSize: '0.85rem', cursor: 'pointer', outline: 'none',
              backdropFilter: 'blur(4px)'
            }}
          >
             <option value="en" style={{ color: 'black' }}>{t('English')}</option>
             <option value="so" style={{ color: 'black' }}>{t('Somali')}</option>
             <option value="ar" style={{ color: 'black' }}>{t('Arabic')}</option>
          </select>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 50, padding: '0.6rem 1.25rem', marginBottom: '1.25rem' }}>
          <Shield size={18} color="#60a5fa" />
          <span style={{ color: '#93c5fd', fontWeight: 700, fontSize: '0.85rem' }}>{t('Waqooyi Bari National ID Management System')} · {t('QR Verification')}</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Powered by Siyaad National ID System</div>
      </motion.div>

      {/* Loading */}
      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 52, height: 52, border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #60a5fa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{t('Verifying identity...')}</div>
        </motion.div>
      )}

      {/* Not found */}
      {!loading && citizen === 'not-found' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 24, padding: '3rem 2.5rem', textAlign: 'center', maxWidth: 480, width: '100%' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <XCircle size={36} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fca5a5', marginBottom: '0.75rem' }}>{t('Identity Not Found')}</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
            {t('No registered citizen matches National ID')} <strong style={{ color: '#fff' }}>{nationalId}</strong>. {t('This QR code may be invalid or the record has been removed.')}
          </p>
        </motion.div>
      )}

      {/* Found */}
      {!loading && citizen && citizen !== 'not-found' && (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          style={{ width: '100%', maxWidth: 640 }}>

          {/* Status banner */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
              padding: '0.75rem 1.5rem', borderRadius: 50, marginBottom: '1.5rem',
              background: isActive ? 'rgba(16,185,129,0.15)' : isPending ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${isActive ? 'rgba(16,185,129,0.4)' : isPending ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)'}`,
              width: 'fit-content', margin: '0 auto 1.5rem',
            }}>
            {isActive ? <CheckCircle size={18} color="#10b981" /> : isPending ? <AlertCircle size={18} color="#f59e0b" /> : <XCircle size={18} color="#ef4444" />}
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isActive ? '#6ee7b7' : isPending ? '#fcd34d' : '#fca5a5' }}>
              {isActive ? t('VERIFIED — ACTIVE CITIZEN') : `${t('VERIFIED')} — ${t(citizen.status).toUpperCase()}`}
            </span>
          </motion.div>

          {/* Main card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 24, overflow: 'hidden', backdropFilter: 'blur(20px)',
            }}>
            {/* Top accent */}
            <div style={{ height: 4, background: isActive ? 'linear-gradient(90deg,#10b981,#34d399)' : isPending ? 'linear-gradient(90deg,#f59e0b,#fcd34d)' : 'linear-gradient(90deg,#ef4444,#fca5a5)' }} />

            <div style={{ padding: '2rem' }}>

              {/* Photo + Name + ID */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {citizen.photo ? (
                  <img src={citizen.photo} alt="" style={{ width: 90, height: 110, objectFit: 'cover', borderRadius: 14, border: '3px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 90, height: 110, borderRadius: 14, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2.5rem', fontWeight: 800, flexShrink: 0 }}>
                    {citizen.fullName.charAt(0)}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>{t('Full Name')}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: '0.5rem', wordBreak: 'break-word' }}>{citizen.fullName}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: '#93c5fd', background: 'rgba(96,165,250,0.1)', padding: '0.25rem 0.75rem', borderRadius: 8, display: 'inline-block' }}>
                    {citizen.nationalIdNumber}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem' }} />

              {/* Personal Info Grid */}
              <div style={{ marginBottom: '1rem', fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t('Personal Information')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <InfoField icon={<User size={13} />} label={t('Father Name')} value={citizen.fatherName} />
                <InfoField icon={<User size={13} />} label={t('Mother Name')} value={citizen.motherName} />
                <InfoField icon={<User size={13} />} label={t('Gender')} value={t(citizen.gender)} />
                <InfoField icon={<Heart size={13} />} label={t('Marital Status')} value={t(citizen.maritalStatus)} />
                <InfoField icon={<Calendar size={13} />} label={t('Date of Birth')} value={safeFormat(citizen.dateOfBirth, 'dd MMM yyyy')} />
                <InfoField icon={<MapPin size={13} />} label={t('Place of Birth')} value={citizen.placeOfBirth} />
                <InfoField icon={<Briefcase size={13} />} label={t('Occupation')} value={citizen.occupation || '—'} />
                <InfoField icon={<Phone size={13} />} label={t('Phone Number')} value={citizen.phone} />
                <InfoField icon={<MapPin size={13} />} label={t('District')} value={citizen.district} />
                <InfoField icon={<UserCheck size={13} />} label={t('Registration Status')} value={t(citizen.status)} />
              </div>

              {/* Full address */}
              {citizen.address && (
                <div style={{ marginBottom: '1rem' }}>
                  <InfoField icon={<Home size={13} />} label={t('Full Address')} value={citizen.address} />
                </div>
              )}

              {/* Divider */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '1rem 0' }} />

              {/* ID Validity */}
              <div style={{ marginBottom: '1rem', fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {t('ID Card Information')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <InfoField icon={<Calendar size={13} />} label={t('Issue Date')} value={safeFormat(citizen.issueDate, 'dd MMM yyyy')} />
                <InfoField icon={<Calendar size={13} />} label={t('Valid Until')} value={safeFormat(citizen.expiryDate, 'dd MMM yyyy')} />
                <InfoField icon={<Hash size={13} />} label={t('National ID')} value={citizen.nationalIdNumber} />
                <InfoField icon={<Clock size={13} />} label={t('Registered On')} value={safeFormat(citizen.registrationDate, 'dd MMM yyyy')} />
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
            {t('Verified on')} {safeFormat(new Date().toISOString(), 'dd MMM yyyy, HH:mm')} · Waqooyi Bari National ID System
          </div>
        </motion.div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
