import React from 'react';
import CitizenSummary from './CitizenSummary';
import type { Citizen } from '../types';

/**
 * Static one‑page view for the citizen "ali ali".
 * Uses the premium CitizenSummary component for a polished look.
 */
export default function CitizenInfoAli() {
  const citizen: Citizen = {
    id: '2',
    fullName: 'ali ali',
    fatherName: 'abdi jaamac hussien',
    motherName: 'fD',
    dateOfBirth: '2026-07-25', // ISO format
    gender: 'Male',
    phone: '+252702236173',
    occupation: 'Accountant',
    district: 'Garowe',
    address: 'tooci',
    nationalIdNumber: 'WB-2026-000002',
    registrationDate: '2026-07-07',
    issueDate: '2026-07-07',
    expiryDate: '2036-07-07',
    status: 'Active',
    photo: null,
    qrCode: '',
    placeOfBirth: 'Garowe',
    maritalStatus: 'Single',
    fingerprint: '',
  };

  return (
    <div className="fade-in-up" style={{ padding: '2rem' }}>
      <header className="page-header">
        <div>
          <h1 className="page-title">Official Citizen Information</h1>
          <p className="page-subtitle">Scan the QR code to verify identity</p>
        </div>
      </header>
      <CitizenSummary citizen={citizen} />
    </div>
  );
}
