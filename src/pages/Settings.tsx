import React, { useState, useRef, useEffect } from 'react';
import { Settings, Save, Upload, Palette, Type, X, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSettings, saveSettings, clearAllCitizens } from '../services/storage';
import { compressImage } from '../services/imageUtils';
import { useTranslation } from '../i18n';
import type { AppSettings } from '../types';

const DEFAULT_SETTINGS: AppSettings = {
  stateName: 'Waqooyi Bari',
  logoUrl: null,
  flagUrl: null,
  watermarkUrl: null,
  cardTemplate: 'default',
  primaryColor: '#3b82f6',
  accentColor: '#1e40af',
};

const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
    <div style={{ fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', borderBottom: '2px solid var(--bg-main)', paddingBottom: '1rem' }}>
      <span style={{ color: 'var(--primary-color)', background: 'rgba(37,99,235,0.1)', padding: '0.4rem', borderRadius: '8px', display: 'flex' }}>{icon}</span> {title}
    </div>
    {children}
  </motion.div>
);

export default function SettingsPage() {
  const { t, language, setLanguage } = useTranslation();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const logoRef = useRef<HTMLInputElement>(null);
  const flagRef = useRef<HTMLInputElement>(null);
  const watermarkRef = useRef<HTMLInputElement>(null);
  const signatureRef = useRef<HTMLInputElement>(null);
  const leftLogoRef = useRef<HTMLInputElement>(null);

  const initialLoadDone = useRef(false);

  useEffect(() => {
    getSettings()
      .then(s => {
        setSettings(s);
        setTimeout(() => { initialLoadDone.current = true; }, 100);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Persist language change to localStorage immediately so QR/verify pages pick it up
  const handleSetLanguage = (lang: 'en' | 'so' | 'ar') => {
    setLanguage(lang);
    localStorage.setItem('app-language', lang);
  };

  // Auto-save whenever settings change
  useEffect(() => {
    if (!initialLoadDone.current || loading) return;

    const timer = setTimeout(async () => {
      try {
        await saveSettings(settings);
        setSaved(true);
        window.dispatchEvent(new Event('settings-updated'));
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        console.error('Failed to auto-save settings:', err);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [settings, loading]);

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await compressImage(reader.result as string, 150);
      setSettings(s => ({ ...s, logoUrl: compressed }));
    };
    reader.readAsDataURL(file);
  }

  function handleFlagUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await compressImage(reader.result as string, 100);
      setSettings(s => ({ ...s, flagUrl: compressed }));
    };
    reader.readAsDataURL(file);
  }

  function handleWatermarkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await compressImage(reader.result as string, 150);
      setSettings(s => ({ ...s, watermarkUrl: compressed }));
    };
    reader.readAsDataURL(file);
  }

  function handleSignatureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await compressImage(reader.result as string, 200);
      setSettings(s => ({ ...s, officialSignatureUrl: compressed }));
    };
    reader.readAsDataURL(file);
  }

  function handleLeftLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await compressImage(reader.result as string, 150);
      setSettings(s => ({ ...s, leftLogoUrl: compressed }));
    };
    reader.readAsDataURL(file);
  }

  async function handleClearAll() {
    if (window.confirm('Are you sure? This will delete ALL citizen data!')) {
      try {
        await clearAllCitizens();
        window.location.reload();
      } catch (err) {
        alert('Failed to clear data: ' + (err as Error).message);
      }
    }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: '#8b9bb4' }}>Loading settings…</div>
  );

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="fade-in-up">
      <div className="page-header" style={{ maxWidth: '800px', margin: '0 auto 2rem' }}>
        <div>
          <div className="page-title">{t('System Settings')}</div>
          <div className="page-subtitle">{t('Manage application preferences')}</div>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-secondary" style={{ cursor: 'default', background: saved ? 'var(--primary-color)' : 'var(--bg-card)', color: saved ? 'white' : 'var(--text-muted)', borderColor: saved ? 'var(--primary-color)' : 'var(--border-color)', transition: 'all 0.3s' }}>
          <Save size={16} /> {saved ? t('✓ Autosaved') : t('Auto-saving is ON')}
        </motion.button>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Language */}
        <Section title={t('Language')} icon={<Globe size={20} />}>
          <div>
            <label className="form-label">{t('Select language for the system')}</label>
            <select
              className="form-input"
              value={language}
              onChange={e => handleSetLanguage(e.target.value as 'en' | 'so' | 'ar')}
              style={{ maxWidth: '100%' }}
            >
              <option value="en">{t('English')}</option>
              <option value="so">{t('Somali')}</option>
              <option value="ar">{t('Arabic')}</option>
            </select>
          </div>
        </Section>
        
        {/* General */}
        <Section title={t('General Settings') || 'General Settings'} icon={<Settings size={20} />}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">{t('State / Region Name') || 'State / Region Name'}</label>
              <input
                className="form-input"
                value={settings.stateName}
                onChange={e => setSettings(s => ({ ...s, stateName: e.target.value }))}
                placeholder="e.g. Waqooyi Bari"
              />
            </div>
            <div>
              <label className="form-label">{t('Authorized Official Signature Name') || 'Authorized Official Signature Name'}</label>
              <input
                className="form-input"
                value={settings.officialSignatureName || ''}
                onChange={e => setSettings(s => ({ ...s, officialSignatureName: e.target.value }))}
                placeholder="e.g. Eng. Jama Ali"
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>This name will appear under the signature line in the PDF exports.</p>
            </div>
            
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => signatureRef.current?.click()}
                style={{
                  width: 140, height: 80, borderRadius: '12px',
                  border: '2px dashed var(--border-color)', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  background: 'var(--bg-main)', overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}
                className="hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
              >
                {settings.officialSignatureUrl ? (
                  <img src={settings.officialSignatureUrl} alt="Signature" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <>
                    <Upload size={24} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upload Image</span>
                  </>
                )}
              </motion.div>
              <input ref={signatureRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleSignatureUpload} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Signature Image (Optional)</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Upload a transparent PNG of the official's signature.</div>
                {settings.officialSignatureUrl && (
                  <button
                    className="btn-danger"
                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                    onClick={() => setSettings(s => ({ ...s, officialSignatureUrl: null }))}
                  >
                    <X size={14} /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </Section>

        {/* Logo */}
        <Section title={t('System Logo') || 'System Logo'} icon={<Upload size={20} />}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => logoRef.current?.click()}
              style={{
                width: 140, height: 140, borderRadius: '16px',
                border: '2px dashed var(--border-color)', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                background: 'var(--bg-main)', overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}
              className="hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
            >
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <>
                  <Upload size={28} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('Upload Logo') || 'Upload Logo'}</span>
                </>
              )}
            </motion.div>
            <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{t('Organization Logo')}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{t('Upload your government seal or logo. PNG/SVG recommended.') || 'Upload your government seal or logo. PNG/SVG recommended.'}</div>
              {settings.logoUrl && (
                <button
                  className="btn-danger"
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                  onClick={() => setSettings(s => ({ ...s, logoUrl: null }))}
                >
                  <X size={16} /> Remove Logo
                </button>
              )}
            </div>
          </div>
        </Section>

        {/* ID Card Left Logo */}
        <Section title="ID Card Left Logo" icon={<Upload size={20} />}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => leftLogoRef.current?.click()}
              style={{
                width: 80, height: 80, borderRadius: '50%',
                border: '2px dashed var(--border-color)', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                background: 'var(--bg-main)', overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}
              className="hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
            >
              {settings.leftLogoUrl ? (
                <img src={settings.leftLogoUrl} alt="Left Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <Upload size={24} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upload</span>
                </>
              )}
            </motion.div>
            <input ref={leftLogoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLeftLogoUpload} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>ID Card Left Logo</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Upload the logo/emblem for the left corner of the ID card. Stored centrally — all devices show the same logo.</div>
              {settings.leftLogoUrl && (
                <button
                  className="btn-danger"
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                  onClick={() => setSettings(s => ({ ...s, leftLogoUrl: null }))}
                >
                  <X size={16} /> Remove
                </button>
              )}
            </div>
          </div>
        </Section>

        {/* Flag */}
        <Section title={t('ID Card Flag') || 'ID Card Flag'} icon={<Upload size={20} />}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => flagRef.current?.click()}
              style={{
                width: 140, height: 90, borderRadius: '12px',
                border: '2px dashed var(--border-color)', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                background: 'var(--bg-main)', overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}
              className="hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
            >
              {settings.flagUrl ? (
                <img src={settings.flagUrl} alt="Flag" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <>
                  <Upload size={28} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Upload Flag</span>
                </>
              )}
            </motion.div>
            <input ref={flagRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFlagUpload} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>ID Card Flag</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Upload the flag to display on the ID Card Preview.</div>
              {settings.flagUrl && (
                <button
                  className="btn-danger"
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                  onClick={() => setSettings(s => ({ ...s, flagUrl: null }))}
                >
                  <X size={16} /> Remove Flag
                </button>
              )}
            </div>
          </div>
        </Section>

        {/* Watermark Logo */}
        <Section title="ID Card Watermark" icon={<Upload size={20} />}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => watermarkRef.current?.click()}
              style={{
                width: 140, height: 140, borderRadius: '16px',
                border: '2px dashed var(--border-color)', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                background: 'var(--bg-main)', overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}
              className="hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
            >
              {settings.watermarkUrl ? (
                <img src={settings.watermarkUrl} alt="Watermark" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <>
                  <Upload size={28} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Upload Watermark</span>
                </>
              )}
            </motion.div>
            <input ref={watermarkRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleWatermarkUpload} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>ID Card Background Watermark</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Upload the logo/emblem to show faintly behind the citizen's details.</div>
              {settings.watermarkUrl && (
                <button
                  className="btn-danger"
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                  onClick={() => setSettings(s => ({ ...s, watermarkUrl: null }))}
                >
                  <X size={16} /> Remove Watermark
                </button>
              )}
            </div>
          </div>
        </Section>





        {/* Danger Zone */}
        <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} className="glass-card" style={{ padding: '2rem', border: '1px solid rgba(220, 38, 38, 0.3)', background: 'rgba(220, 38, 38, 0.05)' }}>
          <div style={{ fontWeight: 800, color: '#dc2626', marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚠️ Danger Zone
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Clearing all data will permanently delete all registered citizens from the database. This action cannot be undone.
          </div>
          <button className="btn-danger" onClick={handleClearAll} style={{ padding: '0.75rem 1.5rem' }}>
            🗑️ Clear All Citizens Data
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
