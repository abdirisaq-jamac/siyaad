import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import type { Citizen, Gender, CitizenStatus, MaritalStatus } from '../types';
import { getCitizens } from './storage';

/** Generate a unique National ID like WB-2024-000001 */
export async function generateNationalIdNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const citizens = await getCitizens();   // ← async now
  const seq = String(citizens.length + 1).padStart(6, '0');
  return `WB-${year}-${seq}`;
}

/** Generate QR Code as data URL */
export async function generateQRCode(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 200,
    margin: 1,
    color: { dark: '#0a1628', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  });
}

/** Build a new Citizen object */
export async function buildCitizen(form: {
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
  photo: string | null;
  status?: CitizenStatus;
}): Promise<Citizen> {
  const id = uuidv4();
  const nationalIdNumber = await generateNationalIdNumber();  // ← await
  const now = new Date();
  const issueDate = now.toISOString().split('T')[0];
  const expiryDate = new Date(now.setFullYear(now.getFullYear() + 10))
    .toISOString().split('T')[0];

  // Encode only the National ID — clean, parseable by any QR scanner or our camera page
  const qrCode = await generateQRCode(nationalIdNumber);

  return {
    id,
    nationalIdNumber,
    fullName: form.fullName,
    fatherName: form.fatherName,
    motherName: form.motherName,
    dateOfBirth: form.dateOfBirth,
    placeOfBirth: form.placeOfBirth,
    gender: form.gender,
    maritalStatus: form.maritalStatus,
    phone: form.phone,
    occupation: form.occupation,
    address: form.address,
    district: form.district,
    photo: form.photo,
    fingerprint: null,
    qrCode,
    status: form.status ?? 'Active',
    registrationDate: issueDate,
    issueDate,
    expiryDate,
  };
}
