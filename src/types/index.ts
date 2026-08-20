// Types for the Waqooyi Bari National ID Management System

export type Gender = 'Male' | 'Female';
export type MaritalStatus = 'Single' | 'Married' | 'Divorced' | 'Widowed';
export type CitizenStatus = 'Active' | 'Pending' | 'Rejected';

export interface Citizen {
  id: string;
  nationalIdNumber: string;
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
  photo: string | null;          // base64
  fingerprint: string | null;    // base64 (optional)
  qrCode: string;
  status: CitizenStatus;
  registrationDate: string;
  issueDate: string;
  expiryDate: string;
}

export interface AppSettings {
  stateName: string;
  logoUrl: string | null;
  leftLogoUrl?: string | null;
  flagUrl: string | null;
  watermarkUrl: string | null;
  cardTemplate: 'default' | 'classic' | 'modern';
  primaryColor: string;
  accentColor: string;
  officialSignatureName?: string;
  officialSignatureUrl?: string | null;
}

export interface DashboardStats {
  totalCitizens: number;
  totalIdCards: number;
  pendingApplications: number;
  approvedApplications: number;
  todayRegistrations: number;
}

// ── Users & Permissions ───────────────────────────────────────────────────────

export type UserRole = string;

export interface Permission {
  // Dashboard
  viewDashboard: boolean;
  // Citizens
  viewCitizens: boolean;
  registerCitizen: boolean;
  editCitizen: boolean;
  deleteCitizen: boolean;
  printProfile: boolean;
  exportProfile: boolean;
  // ID Cards
  viewIdCards: boolean;
  exportIdCard: boolean;
  savePNG: boolean;
  exportPDF: boolean;
  // QR
  verifyQR: boolean;
  generateQR: boolean;
  // Reports
  viewReports: boolean;
  exportReports: boolean;
  // Settings
  viewSettings: boolean;
  editSettings: boolean;
  // Users Management
  viewUsers: boolean;
  manageUsers: boolean;
}

export interface AppUser {
  id: string;
  fullName: string;
  username: string;
  password: string;   // stored as-is (demo only; in production use hashing)
  role: UserRole;
  permissions: Permission;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
  avatar: string | null;   // base64
}

export interface UserSession {
  id: string;
  userId: string;
  username: string;
  loginTime: string;
  logoutTime: string | null;
  deviceInfo: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet' | 'Unknown';
  os: string;
  browser: string;
}
