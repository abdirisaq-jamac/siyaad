import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import type { Citizen, Gender, CitizenStatus, MaritalStatus } from '../types';
import { getCitizens } from './storage';
import { compressImage } from './imageUtils';

/** Generate a unique National ID: WB-GYYRYMMDDSSS */
export async function generateNationalIdNumber(gender: Gender, dateOfBirth: string): Promise<string> {
  const citizens = await getCitizens();
  
  // WB = Fixed prefix
  const prefix = 'WB';
  
  // G = Gender Code (1 = Male, 2 = Female)
  const g = gender === 'Male' ? '1' : '2';
  
  // YY = Last 2 digits of Birth Year
  let dobYear = '00';
  try {
    const d = new Date(dateOfBirth);
    if (!isNaN(d.getTime())) {
      dobYear = d.getFullYear().toString().slice(-2);
    }
  } catch (e) {}

  const now = new Date();
  
  // RY = Last 2 digits of Registration Year
  const ry = now.getFullYear().toString().slice(-2);
  
  // MM = Registration Month
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  
  // DD = Registration Day
  const dd = String(now.getDate()).padStart(2, '0');

  // Base prefix for search: WB-GYYRYMMDD
  const baseId = `${prefix}-${g}${dobYear}${ry}${mm}${dd}`;

  // SSS = Unique Serial Number (3 digits)
  // Find all existing IDs that start with this base
  let maxSerial = 0;
  for (const citizen of citizens) {
    if (citizen.nationalIdNumber?.startsWith(baseId)) {
      const serialStr = citizen.nationalIdNumber.slice(baseId.length);
      const serialNum = parseInt(serialStr, 10);
      if (!isNaN(serialNum) && serialNum > maxSerial) {
        maxSerial = serialNum;
      }
    }
  }

  const newSerial = maxSerial + 1;
  const sss = String(newSerial).padStart(3, '0');

  return `${baseId}${sss}`;
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
  const nationalIdNumber = await generateNationalIdNumber(form.gender, form.dateOfBirth);
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
