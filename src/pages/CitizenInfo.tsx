import React from 'react';
import CitizenSummary from './CitizenSummary';
import type { Citizen } from '../types';

/**
 * Static page presenting a single citizen's details.
 * Data is hard‑coded based on the user's request.
 */
export default function CitizenInfo() {
  const citizen: Citizen = {
    id: '1',
    fullName: 'Abdirisaaq Jaamac',
    fatherName: "ali jaamac hussien",
    motherName: 'fadumo',
    dateOfBirth: '2026-06-07', // ISO format
    gender: 'Male',
    phone: '+2520906718147',
    occupation: 'Business Owner',
    district: 'Garowe',
    address: 'wadajir',
    nationalIdNumber: 'WB-2026-000001',
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
