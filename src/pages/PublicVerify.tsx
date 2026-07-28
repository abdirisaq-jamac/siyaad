import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Shield, User, Calendar, MapPin, Phone, Briefcase, Heart } from 'lucide-react';
import { getCitizenByNationalId } from '../services/storage';
import type { Citizen } from '../types';
import { format } from 'date-fns';

export default function PublicVerify() {
  const { nationalId } = useParams<{ nationalId: string }>();
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

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem', fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 50, padding: '0.6rem 1.25rem', marginBottom: '1.25rem' }}>
          <Shield size={18} color="#60a5fa" />
          <span style={{ color: '#93c5fd', fontWeight: 700, fontSize: '0.85rem' }}>Waqooyi Bari · Identity Verification</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Powered by Siyaad National ID System</div>
      </motion.div>

      {/* Loading */}
      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 52, height: 52, border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #60a5fa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Verifying identity…</div>
        </motion.div>
      )}

      {/* Not found */}
      {!loading && citizen === 'not-found' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 24, padding: '3rem 2.5rem', textAlign: 'center', maxWidth: 480, width: '100%' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <XCircle size={36} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fca5a5', marginBottom: '0.75rem' }}>Identity Not Found</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
            No registered citizen matches National ID <strong style={{ color: '#fff' }}>{nationalId}</strong>. This QR code may be invalid or the record has been removed.
          </p>
        </motion.div>
      )}

      {/* Found */}
      {!loading && citizen && citizen !== 'not-found' && (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          style={{ width: '100%', maxWidth: 560 }}>

          {/* Status banner */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
              padding: '0.75rem 1.5rem', borderRadius: 50, marginBottom: '1.5rem',
              background: isActive ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
              border: `1px solid ${isActive ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'}`,
              width: 'fit-content', margin: '0 auto 1.5rem',
            }}>
            <CheckCircle size={18} color={isActive ? '#10b981' : '#f59e0b'} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isActive ? '#6ee7b7' : '#fcd34d' }}>
              {isActive ? 'VERIFIED — ACTIVE CITIZEN' : `VERIFIED — ${citizen.status.toUpperCase()}`}
            </span>
          </motion.div>

          {/* Main card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 24, overflow: 'hidden', backdropFilter: 'blur(20px)',
            }}>
            {/* Top accent */}
            <div style={{ height: 4, background: isActive ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#f59e0b,#fcd34d)' }} />

            <div style={{ padding: '2rem' }}>
              {/* Photo + Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                {citizen.photo ? (
                  <img src={citizen.photo} alt="" style={{ width: 90, height: 110, objectFit: 'cover', borderRadius: 14, border: '3px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 90, height: 110, borderRadius: 14, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2.5rem', fontWeight: 800, flexShrink: 0 }}>
                    {citizen.fullName.charAt(0)}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Full Name</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: '0.5rem' }}>{citizen.fullName}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: '#93c5fd', background: 'rgba(96,165,250,0.1)', padding: '0.25rem 0.75rem', borderRadius: 8, display: 'inline-block' }}>
                    {citizen.nationalIdNumber}
                  </div>
                </div>
              </div>

              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { icon: <User size={15} />, label: 'Gender', value: citizen.gender },
                  { icon: <Calendar size={15} />, label: 'Date of Birth', value: format(new Date(citizen.dateOfBirth), 'dd MMM yyyy') },
                  { icon: <MapPin size={15} />, label: 'District', value: citizen.district },
                  { icon: <Phone size={15} />, label: 'Phone', value: citizen.phone },
                  { icon: <Briefcase size={15} />, label: 'Occupation', value: citizen.occupation || '—' },
                  { icon: <Heart size={15} />, label: 'Marital Status', value: citizen.maritalStatus },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      {icon} {label}
                    </div>
                    <div style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Expiry */}
              <div style={{ marginTop: '1.25rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>ID Valid Until</div>
                  <div style={{ color: 'white', fontWeight: 700 }}>{format(new Date(citizen.expiryDate), 'dd MMM yyyy')}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Issue Date</div>
                  <div style={{ color: 'white', fontWeight: 700 }}>{format(new Date(citizen.issueDate), 'dd MMM yyyy')}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
            Verified on {format(new Date(), 'dd MMM yyyy, HH:mm')} · Waqooyi Bari National ID System
          </div>
        </motion.div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
