import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, ArrowLeft, X, Camera, Shield, User, MapPin } from 'lucide-react';
import { getCitizenById, updateCitizen } from '../services/storage';
import type { Citizen, Gender, CitizenStatus } from '../types';
import { generateQRCode } from '../services/idGenerator';



function PhotoUpload({ value, onChange, label, icon }: { value: string | null; onChange: (v: string | null) => void; label: string; icon: React.ReactNode }) {
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
          width: '100%', height: 160, border: '2px dashed var(--border-color)', borderRadius: '16px', 
          cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
          background: 'var(--bg-main)', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease' 
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
              onClick={ev => { ev.stopPropagation(); onChange(null); }} 
              style={{ 
                position: 'absolute', top: 10, right: 10, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', 
                border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' 
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

const Field = ({ id: fid, label, children, required }: { id: string; label: string; children: React.ReactNode, required?: boolean }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <label htmlFor={fid} className="form-label">{label} {required && <span style={{ color: '#ef4444' }}>*</span>}</label>
    <div style={{ flex: 1 }}>{children}</div>
  </motion.div>
);

export default function EditCitizen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Partial<Citizen> | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getCitizenById(id)
        .then(c => setForm(c || null))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 52, height: 52, border: '4px solid var(--border-color)', borderTop: '4px solid var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Loading citizen details...</div>
      </div>
    </div>
  );

  if (!form) return (
    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem' }}>
      <Shield size={64} style={{ opacity: 0.3, margin: '0 auto 1.5rem', color: 'var(--primary-color)' }} />
      <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '1rem' }}>Citizen not found</div>
      <button className="btn-secondary" onClick={() => navigate('/citizens')}>
        <ArrowLeft size={16} /> Back to List
      </button>
    </div>
  );

  const set = (k: keyof Citizen, v: unknown) => setForm(f => f ? ({ ...f, [k]: v }) : f);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form?.id) return;
    setSaving(true);
    try {
      // Regenerate QR with new URL data
      const baseUrl = 'https://siyaad-livid.vercel.app';
      const qrData = `${baseUrl}/verify/${form.nationalIdNumber}`;
      const qrCode = await generateQRCode(qrData);
      await updateCitizen({ ...form, qrCode } as Citizen);
      navigate(`/citizens/${form.id}`);
    } finally {
      setSaving(false);
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <motion.div variants={itemVariants} className="page-header" style={{ maxWidth: '1200px', margin: '0 auto 1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-secondary" style={{ padding: '0.6rem' }} onClick={() => navigate(-1)}><ArrowLeft size={20} /></motion.button>
          <div>
            <div className="page-title">Edit Citizen Profile</div>
            <div className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              ID: <code style={{ background: 'var(--bg-main)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>{form.nationalIdNumber}</code>
            </div>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-secondary" onClick={() => navigate(-1)}><X size={16} /> Cancel Editing</motion.button>
      </motion.div>

      <form onSubmit={handleSave} style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '1.5rem', alignItems: 'start' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Photo Section */}
            <motion.div variants={itemVariants} className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid var(--bg-main)', paddingBottom: '1rem' }}>
                <Camera size={20} style={{ color: 'var(--primary-color)' }} /> Citizen Photo
              </div>
              <PhotoUpload value={form.photo || null} onChange={v => set('photo', v)} label="Update Photo" icon={<Camera size={32} />} />
            </motion.div>

            {/* Address Section */}
            <motion.div variants={itemVariants} className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid var(--bg-main)', paddingBottom: '1rem' }}>
                <MapPin size={20} style={{ color: 'var(--primary-color)' }} /> Location & Address
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <Field id="district" label="District">
                  <input id="district" type="text" className="form-input" placeholder="e.g. Garowe" value={form.district || ''} onChange={e => set('district', e.target.value)} />
                </Field>
                <Field id="address" label="Full Address">
                  <textarea id="address" className="form-input" rows={4} value={form.address || ''} onChange={e => set('address', e.target.value)} style={{ resize: 'vertical' }} />
                </Field>
              </div>
            </motion.div>
          </div>

          {/* Personal Info */}
          <motion.div variants={itemVariants} className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', borderBottom: '2px solid var(--bg-main)', paddingBottom: '1rem' }}>
              <div style={{ background: 'var(--primary-gradient)', padding: '0.5rem', borderRadius: '8px', color: 'white' }}>
                <User size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Personal Information</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Update the citizen's personal details.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field id="fullName" label="Full Name" required><textarea id="fullName" className="form-input" rows={2} style={{ resize: 'none' }} value={form.fullName || ''} onChange={e => set('fullName', e.target.value)} required /></Field>
              </div>
              <Field id="fatherName" label="Father Name" required><textarea id="fatherName" className="form-input" rows={2} style={{ resize: 'none' }} value={form.fatherName || ''} onChange={e => set('fatherName', e.target.value)} required /></Field>
              <Field id="motherName" label="Mother Name" required><textarea id="motherName" className="form-input" rows={2} style={{ resize: 'none' }} value={form.motherName || ''} onChange={e => set('motherName', e.target.value)} required /></Field>
              
              <div style={{ gridColumn: '1 / -1', height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>

              <Field id="dateOfBirth" label="Date of Birth"><input id="dateOfBirth" type="date" className="form-input" value={form.dateOfBirth || ''} onChange={e => set('dateOfBirth', e.target.value)} /></Field>
              <Field id="gender" label="Gender">
                <select id="gender" className="form-input" value={form.gender} onChange={e => set('gender', e.target.value as Gender)}>
                  <option value="Male">Male</option><option value="Female">Female</option>
                </select>
              </Field>
              
              <div style={{ gridColumn: '1 / -1', height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>

              <Field id="phone" label="Phone"><input id="phone" className="form-input" value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></Field>
              <Field id="occupation" label="Occupation">
                <textarea id="occupation" className="form-input" rows={2} style={{ resize: 'none' }} placeholder="e.g. Teacher, Doctor" value={form.occupation || ''} onChange={e => set('occupation', e.target.value)} />
              </Field>
              <Field id="status" label="Registration Status">
                <select id="status" className="form-input" value={form.status} onChange={e => set('status', e.target.value as CitizenStatus)}>
                  <option value="Active">Active</option><option value="Pending">Pending</option><option value="Rejected">Rejected</option>
                </select>
              </Field>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2.5rem', borderTop: '2px solid var(--bg-main)', paddingTop: '1.5rem' }}>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" className="btn-secondary" onClick={() => navigate(-1)}>
                Cancel
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" className="btn-primary" disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
                {saving ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="spinner" style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    Saving Changes...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Save size={16} /> Save Changes
                  </span>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </form>
    </motion.div>
  );
}
