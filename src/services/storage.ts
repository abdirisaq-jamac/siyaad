import type { Citizen, AppSettings, AppUser, Permission, UserRole } from '../types';

import { supabase } from '../supabase';

// ── Citizens ──────────────────────────────────────────────────────────────────

export async function getCitizens(): Promise<Citizen[]> {
  const { data, error } = await supabase.from('citizens').select('*').order('createdAt', { ascending: false });
  if (error) {
    console.error('Supabase error fetching citizens:', error);
    return [];
  }
  return data as Citizen[];
}

export async function getCitizenById(id: string): Promise<Citizen | undefined> {
  const { data, error } = await supabase.from('citizens').select('*').eq('id', id).single();
  if (error) return undefined;
  return data as Citizen;
}

export async function getCitizenByNationalId(nationalId: string): Promise<Citizen | undefined> {
  const { data, error } = await supabase.from('citizens').select('*').eq('nationalIdNumber', nationalId).single();
  if (error) return undefined;
  return data as Citizen;
}

export async function getCitizensByName(nameQuery: string): Promise<Citizen[]> {
  const q = nameQuery.toLowerCase().trim();
  if (!q) return [];
  const { data, error } = await supabase.from('citizens').select('*').ilike('fullName', `%${q}%`);
  if (error) return [];
  return data as Citizen[];
}

export async function addCitizen(citizen: Citizen): Promise<Citizen> {
  // Remove client-side timestamps so Supabase auto-generates them
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ...citizenToInsert } = citizen;
  const { data, error } = await supabase.from('citizens').insert([citizenToInsert]).select().single();
  if (error) throw new Error(`Supabase insert error: ${error.message} | Code: ${error.code}`);
  return data as Citizen;
}

export async function updateCitizen(citizen: Citizen): Promise<Citizen> {
  const { data, error } = await supabase.from('citizens').update(citizen).eq('id', citizen.id).select().single();
  if (error) throw new Error(error.message);
  return data as Citizen;
}

export async function deleteCitizen(id: string): Promise<void> {
  const { error } = await supabase.from('citizens').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function clearAllCitizens(): Promise<void> {
  const { error } = await supabase.from('citizens').delete().neq('id', '0'); // deletes all
  if (error) throw new Error(error.message);
}

// ── Settings ──────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  stateName: 'Waqooyi Bari',
  logoUrl: null,
  flagUrl: null,
  watermarkUrl: null,
  cardTemplate: 'default',
  primaryColor: '#00875a',
  accentColor: '#1a4a8a',
};

// Large image blobs are stored in localStorage to avoid Supabase column size limits.
// Only text/scalar settings go to Supabase.
const IMAGE_KEYS = ['flagUrl', 'logoUrl', 'watermarkUrl'] as const;
const LOCAL_IMAGES_KEY = 'app_settings_images';

function loadLocalImages(): Pick<AppSettings, 'flagUrl' | 'logoUrl' | 'watermarkUrl'> {
  try {
    const raw = localStorage.getItem(LOCAL_IMAGES_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { flagUrl: null, logoUrl: null, watermarkUrl: null };
}

function saveLocalImages(settings: AppSettings) {
  const images = { flagUrl: settings.flagUrl, logoUrl: settings.logoUrl, watermarkUrl: settings.watermarkUrl };
  localStorage.setItem(LOCAL_IMAGES_KEY, JSON.stringify(images));
}

export async function getSettings(): Promise<AppSettings> {
  const images = loadLocalImages();
  const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
  const base = (error || !data) ? DEFAULT_SETTINGS : (data as AppSettings);
  // Merge: images from localStorage override whatever Supabase might return
  return { ...base, ...images };
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  // Always save images locally (they're too large for Supabase text columns)
  saveLocalImages(settings);
  // Only send scalar fields to Supabase — strip image blobs
  const scalarSettings: Partial<AppSettings> = { ...settings };
  IMAGE_KEYS.forEach(k => { scalarSettings[k] = null; });
  const { data, error } = await supabase.from('app_settings').upsert({ id: 1, ...scalarSettings }).select().single();
  if (error) throw new Error(error.message);
  // Return full merged settings (scalar from Supabase + images from local)
  return { ...(data as AppSettings), ...loadLocalImages() };
}

// ── Users Management (localStorage-based) ────────────────────────────────────

const USERS_KEY = 'app_users';

export function buildDefaultPermissions(role: UserRole): Permission {
  const all: Permission = {
    viewDashboard: true, viewCitizens: true, registerCitizen: true,
    editCitizen: true, deleteCitizen: true, printProfile: true, exportProfile: true, viewIdCards: true,
    exportIdCard: true, savePNG: true, exportPDF: true, verifyQR: true, generateQR: true, viewReports: true,
    exportReports: true, viewSettings: true, editSettings: true,
    viewUsers: true, manageUsers: true,
  };
  const viewer: Permission = {
    viewDashboard: true, viewCitizens: true, registerCitizen: false,
    editCitizen: false, deleteCitizen: false, printProfile: false, exportProfile: false, viewIdCards: true,
    exportIdCard: false, savePNG: false, exportPDF: false, verifyQR: true, generateQR: false, viewReports: true,
    exportReports: false, viewSettings: false, editSettings: false,
    viewUsers: false, manageUsers: false,
  };
  const dataEntry: Permission = {
    viewDashboard: true, viewCitizens: true, registerCitizen: true,
    editCitizen: true, deleteCitizen: false, printProfile: true, exportProfile: true, viewIdCards: true,
    exportIdCard: false, savePNG: false, exportPDF: false, verifyQR: true, generateQR: true, viewReports: false,
    exportReports: false, viewSettings: false, editSettings: false,
    viewUsers: false, manageUsers: false,
  };
  const editor: Permission = {
    viewDashboard: true, viewCitizens: true, registerCitizen: true,
    editCitizen: true, deleteCitizen: true, printProfile: true, exportProfile: true, viewIdCards: true,
    exportIdCard: true, savePNG: true, exportPDF: true, verifyQR: true, generateQR: true, viewReports: true,
    exportReports: true, viewSettings: true, editSettings: false,
    viewUsers: false, manageUsers: false,
  };
  switch (role) {
    case 'Super Admin': return { ...all };
    case 'Admin':       return { ...all, manageUsers: true, editSettings: true };
    case 'Editor':      return editor;
    case 'Data Entry':  return dataEntry;
    case 'Viewer':      return viewer;
    default:            return viewer;
  }
}

function seedDefaultUsers(): AppUser[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'super-admin-001',
      fullName: 'Super Administrator',
      username: 'admin',
      password: 'admin',
      role: 'Super Admin',
      permissions: buildDefaultPermissions('Super Admin'),
      isActive: true,
      createdAt: now,
      lastLogin: now,
      avatar: null,
    },
  ];
}

function ensureSuperAdmin(users: AppUser[]): AppUser[] {
  const seed = seedDefaultUsers()[0];
  let updatedUsers = users.map(u => {
    const legacyUser = u as any;
    return (legacyUser.email === 'admin@gmail.com' || legacyUser.email === 'admin@admin.com' || u.username === 'admin@admin.com' ? { ...u, username: 'admin', email: undefined } : u);
  });
  const hasSuperAdmin = updatedUsers.some(u => u.role === 'Super Admin' || u.id === seed.id || u.username === seed.username || u.username === 'admin');
  if (!hasSuperAdmin) {
    updatedUsers.unshift(seed);
  }
  return updatedUsers;
}

function getLocalUsers(): AppUser[] {
  const raw = localStorage.getItem(USERS_KEY);
  let users: AppUser[] = [];
  if (raw) {
    try {
      users = JSON.parse(raw);
    } catch {
      users = [];
    }
  }
  users = ensureSuperAdmin(users);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return users;
}

function saveLocalUsers(users: AppUser[]) {
  const ensured = ensureSuperAdmin(users);
  localStorage.setItem(USERS_KEY, JSON.stringify(ensured));
}

export async function getUsers(): Promise<AppUser[]> {
  let list: AppUser[] = [];
  try {
    const { data, error } = await supabase.from('app_users').select('*').order('createdAt', { ascending: false });
    if (!error && data && data.length > 0) {
      list = data as AppUser[];
    } else {
      list = getLocalUsers();
    }
  } catch (err) {
    console.warn('Supabase getUsers error, fallback to local storage:', err);
    list = getLocalUsers();
  }

  list = ensureSuperAdmin(list);
  localStorage.setItem(USERS_KEY, JSON.stringify(list));
  return list;
}

export async function addUser(user: AppUser): Promise<AppUser> {
  let savedUser = user;
  try {
    const { data, error } = await supabase.from('app_users').insert([user]).select().single();
    if (!error && data) {
      savedUser = data as AppUser;
    } else if (error) {
      console.warn('Supabase addUser RLS/error, saved locally:', error.message);
    }
  } catch (err) {
    console.warn('Supabase error saving user, saving locally instead:', err);
  }

  const current = getLocalUsers();
  const updated = [savedUser, ...current.filter(u => u.id !== savedUser.id)];
  saveLocalUsers(updated);
  return savedUser;
}

export async function updateUser(updatedUser: AppUser): Promise<AppUser> {
  let savedUser = updatedUser;
  try {
    const { data, error } = await supabase.from('app_users').update(updatedUser).eq('id', updatedUser.id).select().single();
    if (!error && data) {
      savedUser = data as AppUser;
    } else if (error) {
      console.warn('Supabase updateUser RLS/error, updated locally:', error.message);
    }
  } catch (err) {
    console.warn('Supabase error updating user, updating locally instead:', err);
  }

  const current = getLocalUsers();
  const updatedList = current.map(u => u.id === savedUser.id ? savedUser : u);
  saveLocalUsers(updatedList);
  return savedUser;
}

export async function deleteUser(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('app_users').delete().eq('id', id);
    if (error) {
      console.warn('Supabase deleteUser RLS/error, deleted locally:', error.message);
    }
  } catch (err) {
    console.warn('Supabase error deleting user:', err);
  }

  const current = getLocalUsers();
  const updatedList = current.filter(u => u.id !== id);
  saveLocalUsers(updatedList);
}
