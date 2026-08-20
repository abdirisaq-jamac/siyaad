import type { Citizen, AppSettings, AppUser, Permission, UserRole, UserSession } from '../types';

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
  officialSignatureName: '',
  officialSignatureUrl: null,
};

// officialSignatureName and officialSignatureUrl have no columns in the
// app_settings table, so they are persisted to localStorage instead.
const LOCAL_SIGNATURE_NAME_KEY = 'officialSignatureName';
const LOCAL_SIGNATURE_URL_KEY = 'officialSignatureUrl';

function getLocalSignature(): { name: string; url: string | null } {
  let name = '';
  let url: string | null = null;
  try {
    name = localStorage.getItem(LOCAL_SIGNATURE_NAME_KEY) || '';
    url = localStorage.getItem(LOCAL_SIGNATURE_URL_KEY) || null;
  } catch { /* ignore */ }
  return { name, url };
}

function saveLocalSignature(name: string, url: string | null) {
  try {
    if (name) localStorage.setItem(LOCAL_SIGNATURE_NAME_KEY, name);
    else localStorage.removeItem(LOCAL_SIGNATURE_NAME_KEY);
    if (url) localStorage.setItem(LOCAL_SIGNATURE_URL_KEY, url);
    else localStorage.removeItem(LOCAL_SIGNATURE_URL_KEY);
  } catch { /* ignore */ }
}

export async function getSettings(): Promise<AppSettings> {
  const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
  let baseSettings = DEFAULT_SETTINGS;
  if (!error && data) {
    const { name, url } = getLocalSignature();
    baseSettings = {
      ...DEFAULT_SETTINGS,
      ...data,
      officialSignatureName: data.officialSignatureName ?? name,
      officialSignatureUrl: url,
      leftLogoUrl: data.leftLogoUrl ?? null,
    } as AppSettings;
  }
  return baseSettings;
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  const { leftLogoUrl, officialSignatureName, officialSignatureUrl, ...rest } = settings as any;

  // Persist signature fields to localStorage (no DB columns exist for them)
  saveLocalSignature(officialSignatureName || '', officialSignatureUrl || null);

  const payload: Record<string, unknown> = {
    id: 1,
    ...rest,
    leftLogoUrl: leftLogoUrl ?? null,
  };

  const { data, error } = await supabase
    .from('app_settings')
    .upsert(payload)
    .select().single();

  if (error) throw new Error(error.message);

  return {
    ...data,
    leftLogoUrl: leftLogoUrl ?? null,
    officialSignatureName: officialSignatureName ?? '',
    officialSignatureUrl: officialSignatureUrl ?? null,
  } as AppSettings;
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
  let remoteEmpty = true;
  try {
    const { data, error } = await supabase.from('app_users').select('*').order('createdAt', { ascending: false });
    if (!error && data && data.length > 0) {
      list = data as AppUser[];
      remoteEmpty = false;
    } else {
      list = getLocalUsers();
    }
  } catch (err) {
    console.warn('Supabase getUsers error, fallback to local storage:', err);
    list = getLocalUsers();
  }

  list = ensureSuperAdmin(list);

  // Centralize: if the database has no users, push the local/seed users up so
  // the same credentials work on any device.
  if (remoteEmpty) {
    try {
      await supabase.from('app_users').insert(list.map(u => ({ ...u, createdAt: u.createdAt || new Date().toISOString() })));
    } catch (err) {
      console.warn('getUsers: failed to sync local users to Supabase:', err);
    }
  }

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
    // Upsert so the change always lands in the central database (inserts if the
    // row doesn't exist yet) and then updates the local cache.
    const { data, error } = await supabase.from('app_users').upsert([updatedUser]).select().single();
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

// ── User Sessions ─────────────────────────────────────────────────────────────
// Sessions are stored in localStorage (source of truth) with best-effort
// sync to Supabase, mirroring how app_users works. This keeps Session History
// functional even if the `user_sessions` table does not exist yet.

const SESSIONS_KEY = 'app_user_sessions';

function getLocalSessions(): UserSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

function saveLocalSessions(sessions: UserSession[]) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    /* ignore */
  }
}

export async function getUserSessions(userId?: string): Promise<UserSession[]> {
  const local = getLocalSessions();
  let merged: UserSession[] = local;
  try {
    let query = supabase
      .from('user_sessions')
      .select('*')
      .order('loginTime', { ascending: false })
      .limit(200);
    if (userId) query = query.eq('userId', userId);
    const { data, error } = await query;
    if (!error && data) {
      const remote = data as UserSession[];
      // Prefer remote rows, keep local rows that Supabase doesn't have yet
      merged = [...remote, ...local.filter(s => !remote.some(r => r.id === s.id))];
    }
  } catch (err) {
    console.warn('getUserSessions Supabase error, using local storage:', err);
  }
  const filtered = userId ? merged.filter(s => s.userId === userId) : merged;
  return filtered.sort((a, b) => (b.loginTime || '').localeCompare(a.loginTime || ''));
}

export async function addSession(session: UserSession): Promise<void> {
  const current = getLocalSessions();
  saveLocalSessions([session, ...current.filter(s => s.id !== session.id)]);
  try {
    const { error } = await supabase.from('user_sessions').insert([session]);
    if (error) console.warn('addSession Supabase error, saved locally:', error.message);
  } catch (err) {
    console.warn('addSession Supabase error, saved locally:', err);
  }
}

export async function endSession(sessionId: string): Promise<void> {
  const now = new Date().toISOString();
  const current = getLocalSessions();
  saveLocalSessions(current.map(s => s.id === sessionId ? { ...s, logoutTime: now } : s));
  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({ logoutTime: now })
      .eq('id', sessionId);
    if (error) console.warn('endSession Supabase error, updated locally:', error.message);
  } catch (err) {
    console.warn('endSession Supabase error:', err);
  }
}
