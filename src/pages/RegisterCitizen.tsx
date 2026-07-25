import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Upload, Camera, Save, X, User, ChevronRight, CheckCircle2, Eye } from 'lucide-react';
import { buildCitizen } from '../services/idGenerator';
import { addCitizen, getCitizens } from '../services/storage';
import { useTranslation } from '../i18n';
import type { Gender, CitizenStatus, MaritalStatus } from '../types';

const DISTRICTS = [
  'Garowe', 'Bosaso', 'Gaalkacyo', 'Qardho', 'Buuhoodle', 'Xudun', 'Taleex',
  'Laascaanood', 'Badhan', 'Dhahar', 'Eyl', 'Jariiban', 'Burtinle', 'Goldogob',
  'Dangorayo', 'Iskushuban', 'Caluula', 'Bargaal', 'Qandala', 'Bandarbayla',
  'Widhwidh', 'Yagoori', 'Boocame'
];

const OCCUPATIONS = [
  'Government Employee', 'Teacher', 'Doctor', 'Engineer', 'Farmer',
  'Merchant', 'Student', 'Driver', 'Security Officer', 'Nurse',
  'Lawyer', 'Accountant', 'Business Owner', 'Unemployed', 'Other',
];

interface FormData {
  fullName: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
  phone: string;
  occupation: string;
  address: string;
  district: string;
  status: CitizenStatus;
  photo: string | null;
}

const initial: FormData = {
  fullName: '', fatherName: '', motherName: '',
  dateOfBirth: '', placeOfBirth: '', gender: 'Male', maritalStatus: 'Single',
  phone: '', occupation: '', address: '',
  district: DISTRICTS[0], status: 'Active',
  photo: null,
};

function PhotoUpload({ value, onChange, label, icon }: {
  value: string | null;
  onChange: (v: string | null) => void;
  label: string;
  icon: React.ReactNode;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <label className="form-label">{label}</label>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => ref.current?.click()}
        style={{
          width: '100%', height: 160,
          border: '2px dashed var(--border-color)',
          borderRadius: '16px',
          cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          background: 'var(--bg-main)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}
        className="hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
      >
        {value ? (
          <>
            <img src={value} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={e => { e.stopPropagation(); onChange(null); }}
              style={{
                position: 'absolute', top: 10, right: 10,
                background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
                border: 'none',
                borderRadius: '50%', width: 32, height: 32,
                cursor: 'pointer', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            ><X size={16} /></motion.button>
          </>
        ) : (
          <>
            <div style={{ color: 'var(--primary-color)', padding: '1rem', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '50%' }}>{icon}</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>Click to upload {label}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>JPG, PNG supported</span>
            </div>
          </>
        )}
        <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      </motion.div>
    </div>
  );
}

const Field = ({ id, label, error, children, required }: { id: string; label: string; error?: string; children: React.ReactNode, required?: boolean }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <label htmlFor={id} className="form-label">
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    <div style={{ flex: 1, position: 'relative' }}>
      {children}
    </div>
    <AnimatePresence>
      {error && (
        <motion.p 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: 500 }}
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  </motion.div>
);

export default function RegisterCitizen() {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormData>(initial);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const navigate = useNavigate();

  const set = (key: keyof FormData, val: string | null) =>
    setForm(f => ({ ...f, [key]: val }));

  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.fatherName.trim()) e.fatherName = "Father's name is required";
    if (!form.motherName.trim()) e.motherName = "Mother's name is required";
    if (!form.dateOfBirth) e.dateOfBirth = 'Date of birth is required';
    if (!form.placeOfBirth.trim()) e.placeOfBirth = 'Place of birth is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.occupation.trim()) e.occupation = 'Occupation is required';
    if (!form.address.trim()) e.address = 'Address is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      alert("Fadlan buuxi dhammaan meelaha banaan ee loo baahan yahay (Please fill all required fields).");
      return;
    }
    setLoading(true);
    try {
      const allCitizens = await getCitizens();
      
      const duplicateName = allCitizens.find(c => c.fullName.toLowerCase() === form.fullName.trim().toLowerCase());
      if (duplicateName) {
        alert("Qof magacan leh horay ayaa loo diiwaangeliyay! Fadlan hubi xogta aad gelinayso.");
        setLoading(false);
        return;
      }

      if (form.photo) {
        const duplicatePhoto = allCitizens.find(c => c.photo === form.photo);
        if (duplicatePhoto) {
          alert("Sawirkan horay ayaa loo adeegsaday (This photo is already used by another citizen). Fadlan sawir kale dooro.");
          setLoading(false);
          return;
        }
      }

      const citizen = await buildCitizen(form);
      await addCitizen(citizen);
      navigate(`/citizens/${citizen.id}`);
    } catch (err: any) {
      console.error(err);
      alert("Waxaa dhacay cilad (Error): " + (err.message || "Failed to register citizen"));
    } finally {
      setLoading(false);
    }
  }

  const formVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Page Header */}
      <div style={{
        maxWidth: '1200px', margin: '0 auto 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.75rem',
      }}>
        <div>
          <div className="page-title">{t('Citizen Registration')}</div>
          <div className="page-subtitle">Fill in citizen details to generate a secure National ID</div>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" className="btn-secondary" onClick={() => navigate('/citizens')}>
          <X size={18} /> Cancel
        </motion.button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Tabs - full width on mobile */}
        <div style={{
          display: 'flex', gap: '0.5rem', marginBottom: '1.5rem',
          background: 'var(--bg-main)', padding: '0.4rem',
          borderRadius: '12px', border: '1px solid var(--border-color)',
          width: '100%', boxSizing: 'border-box',
        }}>
          <button
            className={`btn-secondary ${activeTab === 'form' ? 'active' : ''}`}
            style={{
              flex: 1,
              justifyContent: 'center',
              background: activeTab === 'form' ? 'var(--bg-sidebar-hover)' : 'transparent',
              borderColor: activeTab === 'form' ? 'var(--border-color)' : 'transparent',
              color: activeTab === 'form' ? 'var(--primary-color)' : 'var(--text-muted)',
              boxShadow: activeTab === 'form' ? 'var(--shadow-sm)' : 'none',
              whiteSpace: 'nowrap', fontSize: '0.9rem',
            }}
            onClick={() => setActiveTab('form')}
          >
            <UserPlus size={16} /> {t('Registration Form')}
          </button>
          <button
            className={`btn-secondary ${activeTab === 'preview' ? 'active' : ''}`}
            style={{
              flex: 1,
              justifyContent: 'center',
              background: activeTab === 'preview' ? 'var(--bg-sidebar-hover)' : 'transparent',
              borderColor: activeTab === 'preview' ? 'var(--border-color)' : 'transparent',
              color: activeTab === 'preview' ? 'var(--primary-color)' : 'var(--text-muted)',
              boxShadow: activeTab === 'preview' ? 'var(--shadow-sm)' : 'none',
              whiteSpace: 'nowrap', fontSize: '0.9rem',
            }}
            onClick={() => setActiveTab('preview')}
          >
            <Eye size={16} /> {t('Data Preview')}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'form' ? (
            <motion.form 
              key="form"
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onSubmit={handleSubmit}
            >
              <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <div style={{ background: 'var(--primary-gradient)', padding: '0.5rem', borderRadius: '8px', color: 'white' }}>
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Personal Information</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Fields marked with * are required.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
                  <Field id="fullName" label={t('Full Name')} required error={errors.fullName}>
                    <input id="fullName" className="form-input" placeholder="e.g. John Doe Smith" value={form.fullName}
                      onChange={e => set('fullName', e.target.value)} />
                  </Field>
                  <Field id="fatherName" label={t('Father Name')} required error={errors.fatherName}>
                    <input id="fatherName" className="form-input" placeholder="Father's full name" value={form.fatherName}
                      onChange={e => set('fatherName', e.target.value)} />
                  </Field>
                  <Field id="motherName" label={t('Mother Name')} required error={errors.motherName}>
                    <input id="motherName" className="form-input" placeholder="Mother's full name" value={form.motherName}
                      onChange={e => set('motherName', e.target.value)} />
                  </Field>
                  
                  <div style={{ gridColumn: '1 / -1', height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>

                  <Field id="dateOfBirth" label={t('Date of Birth')} required error={errors.dateOfBirth}>
                    <input id="dateOfBirth" type="date" className="form-input" value={form.dateOfBirth}
                      onChange={e => set('dateOfBirth', e.target.value)} />
                  </Field>
                  <Field id="placeOfBirth" label={t('Place of Birth')} required error={errors.placeOfBirth}>
                    <input id="placeOfBirth" className="form-input" placeholder="City, Region" value={form.placeOfBirth}
                      onChange={e => set('placeOfBirth', e.target.value)} />
                  </Field>
                  <Field id="gender" label={t('Gender')} error={errors.gender}>
                    <select id="gender" className="form-input" value={form.gender}
                      onChange={e => set('gender', e.target.value as Gender)}>
                      <option value="Male">{t('Male')}</option>
                      <option value="Female">{t('Female')}</option>
                    </select>
                  </Field>
                  
                  <div style={{ gridColumn: '1 / -1', height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>

                  <Field id="maritalStatus" label={t('Marital Status')}>
                    <select id="maritalStatus" className="form-input" value={form.maritalStatus}
                      onChange={e => set('maritalStatus', e.target.value as MaritalStatus)}>
                      <option value="Single">{t('Single')}</option>
                      <option value="Married">{t('Married')}</option>
                      <option value="Divorced">{t('Divorced')}</option>
                      <option value="Widowed">{t('Widowed')}</option>
                    </select>
                  </Field>
                  <Field id="phone" label={t('Phone Number')} required error={errors.phone}>
                    <input id="phone" className="form-input" placeholder="+252 XX XXX XXXX" value={form.phone}
                      onChange={e => set('phone', e.target.value)} />
                  </Field>
                  <Field id="occupation" label={t('Occupation')} required error={errors.occupation}>
                    <input 
                      id="occupation"
                      list="occupations-datalist"
                      className="form-input" 
                      placeholder="Select or type occupation..." 
                      value={form.occupation}
                      onChange={e => set('occupation', e.target.value)} 
                    />
                    <datalist id="occupations-datalist">
                      {OCCUPATIONS.map(o => <option key={o} value={o} />)}
                    </datalist>
                  </Field>
                  <Field id="district" label={t('District')} error={errors.district}>
                    <select id="district" className="form-input" value={form.district}
                      onChange={e => set('district', e.target.value)}>
                      {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Field>
                  <Field id="status" label={t('Registration Status')} error={errors.status}>
                    <select id="status" className="form-input" value={form.status}
                      onChange={e => set('status', e.target.value as CitizenStatus)}>
                      <option value="Active">{t('Active')}</option>
                      <option value="Pending">{t('Pending')}</option>
                      <option value="Rejected">{t('Rejected')}</option>
                    </select>
                  </Field>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                      <Field id="address" label={t('Full Address')} required error={errors.address}>
                        <textarea id="address" className="form-input" placeholder="Street name, house number, landmarks..."
                          value={form.address} onChange={e => set('address', e.target.value)}
                          style={{ resize: 'none', height: '190px' }} />
                      </Field>
                      <div>
                        <PhotoUpload value={form.photo} onChange={v => set('photo', v)} label={t('Citizen Photo')} icon={<Camera size={28} />} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" className="btn-secondary" onClick={() => setForm(initial)}>
                    <X size={16} /> {t('Clear Form')}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" className="btn-primary" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
                    {loading ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="spinner" style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        Generating ID…
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Save size={16} /> {t('Save & Generate National ID')}
                      </span>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.form>
          ) : (
            <motion.div 
              key="preview"
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="glass-card" style={{ padding: '2rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div style={{ background: 'var(--primary-gradient)', padding: '0.5rem', borderRadius: '8px', color: 'white' }}>
                  <Eye size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Data Preview</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Review the information before generating ID.</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>
                {form.photo ? (
                  <div style={{ width: 160, flexShrink: 0, textAlign: 'center' }}>
                    <img src={form.photo} alt="preview" style={{ width: 160, height: 160, borderRadius: '16px', objectFit: 'cover', border: '4px solid var(--bg-main)', boxShadow: 'var(--shadow-md)' }} />
                  </div>
                ) : (
                  <div style={{ width: 160, height: 160, flexShrink: 0, background: 'var(--bg-main)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '2px dashed var(--border-color)' }}>
                    <User size={48} opacity={0.3} />
                  </div>
                )}
                
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{t('Full Name')}</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 700 }}>{form.fullName || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{t('Father Name')}</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 500 }}>{form.fatherName || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{t('Mother Name')}</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 500 }}>{form.motherName || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{t('Date of Birth')}</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 500 }}>{form.dateOfBirth || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{t('Place of Birth')}</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 500 }}>{form.placeOfBirth || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{t('Gender')} / {t('Marital Status')}</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 500 }}>{form.gender} / {form.maritalStatus}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{t('Phone')}</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 500 }}>{form.phone || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{t('District')} / {t('Occupation')}</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 500 }}>{form.district} / {form.occupation || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{t('Address')}</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 500 }}>{form.address || '—'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
