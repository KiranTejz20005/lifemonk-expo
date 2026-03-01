/**
 * LifeMonk — Production Auth Service
 * Token: AsyncStorage (lifemonk_auth_token) first, then SecureStore fallback.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const CREATE_STUDENT_URL = `${base}/create_student`;
  const LOGIN_URL = `${base}/auth/login`;

  // Step 1: POST to create student
  const createRes = await fetch(CREATE_STUDENT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      password: data.password,
      grade_level: data.grade_level,
      subscription_type: data.subscription_type,
    }),
  });
  const text = await createRes.text();
  console.log('[Signup] create_student status:', createRes.status);
  console.log('[Signup] create_student response:', text);
  const signupJson = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  if (!createRes.ok) throw new Error((signupJson as { message?: string }).message || 'Signup failed');

  // Step 2: POST to login to get token
  const loginRes = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: data.email,
      password: data.password,
    }),
  });
  const loginJson = (await loginRes.json()) as { authToken?: string; id?: number; name?: string; message?: string };
  if (!loginRes.ok) throw new Error(loginJson.message || 'Login failed after signup');

  // Step 3: Save token and user from login response
  if (loginJson.authToken != null && loginJson.id != null) {
    await saveSession(loginJson.authToken, String(loginJson.id), loginJson.name);
  }

  return {
    authToken: loginJson.authToken,
    id: signupJson.id ?? loginJson.id,
    name: signupJson.name ?? loginJson.name,
    email: data.email,
  };
}

export async function login(email: string, password: string) {
  const base = getXanoAuthBaseUrl();
  if (!base) throw new Error('XANO_AUTH_URL is not configured. Set EXPO_PUBLIC_XANO_AUTH_URL in .env');
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Login failed');
  await SecureStore.setItemAsync('auth_token', String(json.authToken));
  return json;
}

const SESSION_ONLY_KEY = 'session_only';

export async function saveSession(
  token: string,
  userId: any,
  name?: string,
  rememberMe: boolean = true
) {
  await AsyncStorage.setItem('lifemonk_auth_token', String(token));
  await SecureStore.setItemAsync('auth_token', String(token));
  await SecureStore.setItemAsync('user_id', String(userId));
  if (name) await SecureStore.setItemAsync('user_name', String(name));
  if (rememberMe) {
    await SecureStore.deleteItemAsync(SESSION_ONLY_KEY);
  } else {
    await SecureStore.setItemAsync(SESSION_ONLY_KEY, String('1'));
  }
}

export async function getToken(): Promise<string | null> {
  const fromAsync = await AsyncStorage.getItem('lifemonk_auth_token');
  if (fromAsync) return fromAsync;
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
  await AsyncStorage.removeItem('lifemonk_auth_token');
  await AsyncStorage.removeItem('lifemonk_user');
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
