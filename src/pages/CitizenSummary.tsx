import React from 'react';
import { User, Hash, Calendar, Phone, MapPin, CheckCircle } from 'lucide-react';
import type { Citizen } from '../types';
import { format } from 'date-fns';

/**
 * A premium, concise summary card for a citizen's details.
 * Designed with glassmorphism, subtle gradients and micro‑animations.
 */
export default function CitizenSummary({ citizen }: { citizen: Citizen }) {
  return (
    <section className="glass-card summary-card" style={{ maxWidth: 720, margin: '2rem auto', padding: '2rem' }}>
      <header className="summary-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        {citizen.photo ? (
          <img
            src={citizen.photo}
            alt="Citizen portrait"
            className="summary-photo"
            style={{ width: 96, height: 120, objectFit: 'cover', borderRadius: 8, border: '2px solid #00875a' }}
          />
        ) : (
          <div
            className="summary-photo placeholder"
            style={{
              width: 96,
              height: 120,
              background: 'linear-gradient(135deg, #2563eb, #00875a)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '2.5rem',
              fontWeight: 800,
            }}
          >
            {citizen.fullName.charAt(0)}
          </div>
        )}
        <div className="summary-title">
          <h1 className="full-name" style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>{citizen.fullName}</h1>
          <p className="national-id" style={{ margin: 0, color: '#c8a84b' }}>{citizen.nationalIdNumber}</p>
        </div>
      </header>

      <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
        <InfoItem icon={<User size={14} />} label="Gender" value={citizen.gender} />
        <InfoItem icon={<Hash size={14} />} label="DOB" value={format(new Date(citizen.dateOfBirth), 'dd MMM yyyy')} />
        <InfoItem icon={<Phone size={14} />} label="Phone" value={citizen.phone} />
        <InfoItem icon={<MapPin size={14} />} label="District" value={citizen.district} />
        <InfoItem icon={<Calendar size={14} />} label="Expires" value={format(new Date(citizen.expiryDate), 'dd MMM yyyy')} />
        <InfoItem
          icon={<CheckCircle size={14} />}
          label="Status"
          value={citizen.status}
          badge={citizen.status === 'Active' ? 'badge-active' : 'badge-pending'}
        />
      </div>
    </section>
  );
}

// Small reusable component for labelled icon/value pairs
function InfoItem({ icon, label, value, badge }: { icon: React.ReactNode; label: string; value: string; badge?: string }) {
  return (
    <div className="info-item" style={{ padding: '0.5rem 0.75rem', background: '#f1f5f9', borderRadius: 6, border: '1px solid #cbd5e1' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', color: '#8b9bb4', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
        {icon} {label}
      </div>
      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>
        {badge ? <span className={badge}>{value}</span> : value}
      </div>
    </div>
  );
}
