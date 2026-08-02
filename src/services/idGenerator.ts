import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import type { Citizen, Gender, CitizenStatus, MaritalStatus } from '../types';
import { getCitizens } from './storage';
import { compressImage } from './imageUtils';

/** Generate a unique National ID like WB-2026-48291 (5 random digits) */
export async function generateNationalIdNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const citizens = await getCitizens();
  const existingIds = new Set(citizens.map(c => c.nationalIdNumber));

  let candidate = '';
  do {
    const randomHex = uuidv4().split('-')[0].toUpperCase();
    const randomPart2 = uuidv4().split('-')[1].toUpperCase();
    candidate = `WB-${year}-${randomHex}${randomPart2}`;
  } while (existingIds.has(candidate));

  return candidate;
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

  // Encode full public URL so scanning opens the verification page directly
  const baseUrl = 'https://siyaad-livid.vercel.app';
  const qrCode = await generateQRCode(`${baseUrl}/verify/${nationalIdNumber}`);

  // Compress photo if present (keep under 200KB)
  const photo = form.photo ? await compressImage(form.photo, 200) : null;
  // Compress QR code too
  const compressedQR = await compressImage(qrCode, 100);

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
    photo,
    fingerprint: null,
    qrCode: compressedQR,
    status: form.status ?? 'Active',
    registrationDate: issueDate,
    issueDate,
    expiryDate,
  };
}
