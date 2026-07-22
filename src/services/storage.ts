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

export async function getSettings(): Promise<AppSettings> {
  const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
  if (error || !data) return DEFAULT_SETTINGS;
  return data as AppSettings;
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  const { data, error } = await supabase.from('app_settings').upsert({ id: 1, ...settings }).select().single();
  if (error) throw new Error(error.message);
  return data as AppSettings;
}

// ── Users Management (localStorage-based) ────────────────────────────────────

const USERS_KEY = 'app_users';

export function buildDefaultPermissions(role: UserRole): Permission {
  const all: Permission = {
    viewDashboard: true, viewCitizens: true, registerCitizen: true,
    editCitizen: true, deleteCitizen: true, viewIdCards: true,
    exportIdCard: true, verifyQR: true, viewReports: true,
    exportReports: true, viewSettings: true, editSettings: true,
    viewUsers: true, manageUsers: true,
  };
  const viewer: Permission = {
    viewDashboard: true, viewCitizens: true, registerCitizen: false,
    editCitizen: false, deleteCitizen: false, viewIdCards: true,
    exportIdCard: false, verifyQR: true, viewReports: true,
    exportReports: false, viewSettings: false, editSettings: false,
    viewUsers: false, manageUsers: false,
  };
  const dataEntry: Permission = {
    viewDashboard: true, viewCitizens: true, registerCitizen: true,
    editCitizen: true, deleteCitizen: false, viewIdCards: true,
    exportIdCard: false, verifyQR: true, viewReports: false,
    exportReports: false, viewSettings: false, editSettings: false,
    viewUsers: false, manageUsers: false,
  };
  const editor: Permission = {
    viewDashboard: true, viewCitizens: true, registerCitizen: true,
    editCitizen: true, deleteCitizen: true, viewIdCards: true,
    exportIdCard: true, verifyQR: true, viewReports: true,
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
      email: 'admin@gmail.com',
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

export function getUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      const defaults = seedDefaultUsers();
      localStorage.setItem(USERS_KEY, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw) as AppUser[];
  } catch {
    return seedDefaultUsers();
  }
}

export function saveUsers(users: AppUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function addUser(user: AppUser): AppUser {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
  return user;
}

export function updateUser(updated: AppUser): AppUser {
  const users = getUsers().map(u => u.id === updated.id ? updated : u);
  saveUsers(users);
  return updated;
}

export function deleteUser(id: string): void {
  const users = getUsers().filter(u => u.id !== id);
  saveUsers(users);
}
