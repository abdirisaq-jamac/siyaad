import React, { useState } from 'react';
import { QrCode, Search, CheckCircle, XCircle, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCitizenByNationalId, getCitizensByName } from '../services/storage';
import type { Citizen } from '../types';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';

export default function QRVerification() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<Citizen | null | 'not-found'>(null);
  const [multiResults, setMultiResults] = useState<Citizen[]>([]);
  const navigate = useNavigate();
  const { t } = useTranslation();
  // Removed local dark mode state (managed globally)


// Removed theme initialization effect (handled globally)


// Removed theme persistence effect

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    
    setResult(null);
    setMultiResults([]);

    // Check by National ID (exact match)
    const byId = await getCitizenByNationalId(q.toUpperCase());
    if (byId) {
      setResult(byId);
      return;
    }

    // Check by Full Name
    const byName = await getCitizensByName(q);
    if (byName.length === 1) {
      setResult(byName[0]);
    } else if (byName.length > 1) {
      setMultiResults(byName);
    } else {
      setResult('not-found');
    }
  }
// Removed toggleTheme function

  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} style={{ maxWidth: '850px', margin: '0 auto', padding: '2rem 1rem' }}>
      <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80, borderRadius: '50%', background: 'var(--primary-gradient)', color: 'white', marginBottom: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
          <QrCode size={40} />
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>{t('Identity Verification') || 'Identity Verification'}</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto' }}>{t('Enter a National ID Number or a 3-part full name to verify a citizen\'s identity instantly.') || 'Enter a National ID Number or a 3-part full name to verify a citizen\'s identity instantly.'}</p>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            flex: '1 1 300px', background: 'var(--bg-main)', border: '2px solid var(--border-color)',
            borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem',
            transition: 'all 0.3s ease'
          }} className="focus-within:border-primary">
            <Search size={22} style={{ color: 'var(--text-muted)' }} />
            <input
              placeholder="e.g. WB-2024-000001 or Full Name"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: '1.1rem', width: '100%', fontWeight: 500 }}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary"
            style={{ padding: '1.1rem 2rem', fontSize: '1.1rem', borderRadius: '12px' }}
            onClick={handleSearch}
          >
            {t('Verify Now') || 'Verify Now'}
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {multiResults.length > 0 && (
          <motion.div key="multi" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <User size={24} style={{ color: 'var(--primary-color)' }} /> Multiple Citizens Found ({multiResults.length})
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {multiResults.map(c => (
                <motion.div
                  whileHover={{ scale: 1.01, backgroundColor: 'var(--bg-main)' }}
                  whileTap={{ scale: 0.99 }}
                  key={c.id}
                  style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1rem 1.5rem', borderRadius: '12px', cursor: 'pointer', border: '1px solid var(--border-color)', transition: 'all 0.2s' }}
                  onClick={() => { setResult(c); setMultiResults([]); }}
                >
                  {c.photo ? (
                    <img src={c.photo} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }} />
                  ) : (
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.25rem' }}>
                      {c.fullName.charAt(0)}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>{c.fullName}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>ID: <code style={{ color: 'var(--primary-color)', fontWeight: 700 }}>{c.nationalIdNumber}</code> • {c.district}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {result === 'not-found' && (
          <motion.div key="not-found" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <XCircle size={40} style={{ color: '#ef4444' }} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>No Record Found</h3>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
              The National ID or Name <strong style={{ color: 'var(--text-main)' }}>"{query}"</strong> does not match any registered citizen in our system.
            </p>
          </motion.div>
        )}

        {result && result !== 'not-found' && (
          <motion.div key="found" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card" style={{ padding: '3rem 2rem', overflow: 'hidden', position: 'relative' }}>
            {/* Success Background Elements */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'var(--primary-gradient)' }} />
            <div style={{ position: 'absolute', top: 20, right: 20, color: 'var(--primary-color)', opacity: 0.1 }}>
              <CheckCircle size={120} />
            </div>

            <div style={{ display: 'flex', gap: '3rem', alignItems: 'center', position: 'relative', zIndex: 10, flexWrap: 'wrap' }}>
              <div style={{ flexShrink: 0, margin: '0 auto' }}>
                {result.photo ? (
                  <img src={result.photo} alt="" style={{ width: 150, height: 190, objectFit: 'cover', borderRadius: '16px', border: '4px solid var(--bg-main)', boxShadow: 'var(--shadow-md)' }} />
                ) : (
                  <div style={{ width: 150, height: 190, borderRadius: '16px', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '4rem', border: '4px solid var(--bg-main)', boxShadow: 'var(--shadow-md)' }}>
                    {result.fullName.charAt(0)}
                  </div>
                )}
                <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                  <span className={result.status === 'Active' ? 'badge-active' : result.status === 'Pending' ? 'badge-pending' : 'badge-rejected'} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
                    <CheckCircle size={14} style={{ display: 'inline', marginRight: '4px' }} /> {t('VERIFIED') || 'Verified'} {t(result.status)}
                  </span>
                </div>
              </div>
              
              <div style={{ flex: 1, minWidth: '300px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{t('Citizen Identity Confirmed') || 'Citizen Identity Confirmed'}</div>
                <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.5rem', lineHeight: 1.1 }}>{result.fullName}</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{t('National ID')}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{result.nationalIdNumber}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{t('Gender')}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{t(result.gender)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{t('Father Name')}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{result.fatherName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{t('Mother Name')}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{result.motherName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{t('District')}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{result.district}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{t('Phone Number')}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{result.phone}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{t('Date of Birth')}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{format(new Date(result.dateOfBirth), 'dd MMM yyyy')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{t('Occupation')}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{result.occupation || '—'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-secondary" onClick={() => navigate(`/citizens/${result.id}`)}>
                    View Full Profile
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-primary" onClick={() => navigate(`/id-cards/${result.id}`)}>
                    View ID Card
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


