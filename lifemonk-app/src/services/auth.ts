/**
 * LifeMonk — Production Auth Service
 * Uses SecureStore for token persistence and Xano for auth endpoints.
 */

import * as SecureStore from 'expo-secure-store';
import { getXanoAuthBaseUrl } from './config';

// Simple auth state listener for logout events
type AuthListener = () => void;
const authListeners: AuthListener[] = [];

export function onAuthChange(listener: AuthListener) {
  authListeners.push(listener);
  return () => {
    const idx = authListeners.indexOf(listener);
    if (idx >= 0) authListeners.splice(idx, 1);
  };
}

function notifyAuthChange() {
  authListeners.forEach((fn) => fn());
}

export async function signup(data: {
  name: string;
  email: string;
  password: string;
  grade_level: number;
  subscription_type: string;
}) {
  const base = getXanoAuthBaseUrl();
  const SIGNUP_URL = `${base}/create_student`;
  const LOGIN_URL = `${base}/auth/login`;

  // Step 1: Create the student
  // Xano may expect grade_level as string (e.g. "5") or as a grade_id from a grades table; send string to match common API validation.
  const signupRes = await fetch(SIGNUP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      password: data.password,
      grade_level: String(data.grade_level),
      subscription_type: data.subscription_type,
    }),
  });
  const signupJson = await signupRes.json();
  console.log('Signup response:', JSON.stringify(signupJson));
  if (!signupRes.ok) throw new Error(signupJson.message || 'Signup failed');

  // Step 2: Login to get the auth token
  const loginRes = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: data.email,
      password: data.password,
    }),
  });
  const loginJson = await loginRes.json();
  console.log('Login after signup response:', JSON.stringify(loginJson));
  if (!loginRes.ok) throw new Error(loginJson.message || 'Login failed after signup');

  return {
    authToken: loginJson.authToken,
    id: signupJson.id,
    name: signupJson.name,
    email: signupJson.email,
  };
}

export async function login(email: string, password: string) {
  const base = getXanoAuthBaseUrl();
  const res = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Login failed');
  return json;
}

const SESSION_ONLY_KEY = 'session_only';

export async function saveSession(
  token: string,
  userId: any,
  name?: string,
  rememberMe: boolean = true
) {
  await SecureStore.setItemAsync('auth_token', String(token));
  await SecureStore.setItemAsync('user_id', String(userId));
  if (name) await SecureStore.setItemAsync('user_name', name);
  if (rememberMe) {
    await SecureStore.deleteItemAsync(SESSION_ONLY_KEY);
  } else {
    await SecureStore.setItemAsync(SESSION_ONLY_KEY, '1');
  }
}

export async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync('auth_token');
}

export async function getUserId(): Promise<string | null> {
  return await SecureStore.getItemAsync('user_id');
}

export async function getUserName(): Promise<string | null> {
  return await SecureStore.getItemAsync('user_name');
}

export async function getCurrentStudent(): Promise<{
  id: number;
  grade_level: number;
  subscription_type: string;
  name: string;
  email: string;
} | null> {
  try {
    const token = await getToken();
    if (!token) return null;

    const base = getXanoAuthBaseUrl();
    const res = await fetch(base + '/auth/me', {
      headers: { Authorization: 'Bearer ' + token },
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync('auth_token');
  await SecureStore.deleteItemAsync('user_id');
  await SecureStore.deleteItemAsync('user_name');
  await SecureStore.deleteItemAsync(SESSION_ONLY_KEY);
  notifyAuthChange();
}

export async function isLoggedIn(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}

/** Profile returned by the auth API (e.g. /auth/me on the same base as login). */
export interface AuthProfile {
  id?: number;
  name?: string;
  email?: string;
  subscription_type?: string;
  grade_id?: number;
  school_id?: number;
}

/** Fetch current user profile from the auth API. Use this for profile/plan; token was issued by this API. */
export async function getProfile(): Promise<AuthProfile> {
  const token = await getToken();
  if (!token) throw new Error('Not signed in');
  const base = getXanoAuthBaseUrl();
  const res = await fetch(base + '/auth/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error('Profile endpoint not found. Ensure /auth/me exists on your auth API.');
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `Profile failed: ${res.status}`);
  }
  return (await res.json()) as AuthProfile;
}
