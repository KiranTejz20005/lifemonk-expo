/**
 * LifeMonk — Production Auth Service
 * Uses SecureStore for token persistence and Xano for auth endpoints.
 */

import * as SecureStore from 'expo-secure-store';

const XANO_COURSES_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:j1bkW6GC';
const XANO_AUTH_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:oks0Dp98';

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
  const SIGNUP_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:oks0Dp98/create_student';
  const LOGIN_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:oks0Dp98/auth/login';

  // Step 1: Create the student
  const signupRes = await fetch(SIGNUP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      password: data.password,
      grade_level: Number(data.grade_level),
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
  const res = await fetch(XANO_AUTH_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Login failed');
  return json;
}

export async function saveSession(token: string, userId: any, name?: string) {
  await SecureStore.setItemAsync('auth_token', String(token));
  await SecureStore.setItemAsync('user_id', String(userId));
  if (name) await SecureStore.setItemAsync('user_name', name);
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

    const res = await fetch(XANO_AUTH_URL + '/auth/me', {
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
  notifyAuthChange();
}

export async function isLoggedIn(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}
