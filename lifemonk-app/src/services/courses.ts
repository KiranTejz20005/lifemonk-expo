/**
 * LifeMonk — Courses Service
 * Strapi = content (titles, thumbnails, chapters, quiz). Xano = auth, enrollment, progress.
 * Uses env: STRAPI_BASE_URL, STRAPI_API_TOKEN (optional), XANO_BASE_URL.
 * Auth token stored in SecureStore via auth.ts.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { getStrapiBaseUrl, getStrapiApiToken, getXanoAuthBaseUrl, getXanoBaseUrl } from './config';
import { fetchAndPersistUserIdFromAuthMe, getCurrentStudent, getToken, getUserId } from './auth';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_KEY = 'lifemonk_user';

/**
 * Returns the current user_id from SecureStore (set during login/signup).
 * Falls back to stored user profile id, or '1' as last resort.
 */
export async function getCurrentUserId(): Promise<string> {
  const id = await getUserId();
  return id || '1';
}

// --- Strapi raw types ---

type StrapiCategory = { id?: number; documentId?: string; name?: string; visibility?: string } | null;
type StrapiMedia = { url?: string } | null;

export interface StrapiCourseRaw {
  id: number;
  documentId: string;
  title: string;
  short_description?: string;
  description?: string;
  cover_image?: StrapiMedia;
  intro_video_url?: string | null;
  category?: StrapiCategory;
  user_type_visibility?: string;
  instructor_name?: string;
  instructor_bio?: string | null;
  instructor_image?: StrapiMedia;
  grades?: number[] | unknown;
  is_active?: boolean;
  order?: number;
  estimated_hours?: number | null;
  xano_course_id?: number | null;
  publishedAt?: string;
}

export interface StrapiChapterRaw {
  id: number;
  documentId: string;
  title: string;
  chapter_type: string;
  order: number;
  video_url?: string | null;
  content?: string | null;
  duration_minutes?: number;
  is_locked?: boolean;
  lock_depends_on_order?: number | null;
  activity_instructions?: string | null;
  activity_requires_proof?: boolean;
  is_active?: boolean;
  course?: { documentId?: string } | null;
  thumbnail?: StrapiMedia;
  xano_course_id?: number | null;
  xano_chapter_id?: number | null;
}

export interface StrapiQuizQuestion {
  question_text: string;
  options?: string[] | string;
  correct_answer?: string | number;
  explanation?: string;
}

export interface StrapiQuiz {
  id: number;
  documentId: string;
  title: string;
  pass_score?: number;
  questions?: StrapiQuizQuestion[] | unknown;
  xano_chapter_id?: number | null;
  xano_quiz_id?: number | null;
}

// --- Normalized UI types (with bridge IDs) ---

export interface Course {
  id: number;
  documentId: string;
  xanoCourseId: number | null;
  title: string;
  short_description: string;
  description: string;
  cover_image_url: string | null;
  intro_video_url: string | null;
  category: string;
  category_id: string | null;
  user_type_visibility: string;
  instructor_name: string;
  instructor_bio: string;
  instructor_image_url: string | null;
  grades: number[];
  is_active: boolean;
  order: number;
  estimated_hours: number | null;
}

export interface Chapter {
  id: number;
  documentId: string;
  xanoCourseId: number | null;
  xanoChapterId: number | null;
  title: string;
  chapter_type: 'video' | 'text' | 'quiz' | 'activity';
  order: number;
  video_url: string;
  thumbnail_url: string | null;
  content: string;
  duration_minutes: number;
  is_locked: boolean;
  lock_depends_on_order: number;
  activity_instructions: string;
  activity_requires_proof: boolean;
}

export interface QuizQuestion {
  id: number | string;
  question_text: string;
  options: string[];
  correct_answer: string | number;
  explanation?: string;
}

export interface Quiz {
  id: number;
  documentId: string;
  xanoChapterId: number | null;
  title: string;
  pass_score: number;
  questions: QuizQuestion[];
}

// --- Category ---

export interface Category {
  id: number;
  documentId: string;
  name: string;
  description: string | null;
  visibility: string;
  image_url: string | null;
  order: number;
  is_active: boolean;
}

// --- Xano types ---

export interface StudentProfile {
  id: number;
  name: string;
  email: string;
  grade_id: number;
  school_id: number;
  subscription_type: string;
}

export interface AuthResponse {
  authToken: string;
  user: StudentProfile;
}

export interface XanoCourseEntry {
  course_id: number;
  strapi_course_id?: string;
  enrolled: boolean;
  status: 'active' | 'completed' | 'paused' | 'not_enrolled';
  progress_percent: number;
}

export interface XanoChapterProgress {
  chapter_id: number;
  completed: boolean;
  quiz_score: number | null;
  watch_time_seconds: number;
}

export interface XanoCourseProgress {
  status: string;
  progress_percent: number;
  certificate_issued?: boolean;
  chapters: XanoChapterProgress[];
}

/** Alias for views that expect CourseProgress (same shape as XanoCourseProgress). */
export type CourseProgress = XanoCourseProgress;

export interface ChapterProgress {
  chapter_id: number;
  completed: boolean;
  quiz_score: number | null;
  strapi_chapter_id?: string;
  is_completed?: boolean;
}

/** For backward compat: enrollment entry keyed by Strapi documentId. */
export interface UserCourseEntry {
  strapi_course_id: string;
  enrolled: boolean;
  status?: string;
  progress_percent: number;
  course_id?: number;
}

export interface MergedCourse extends Course {
  enrolled: boolean;
  status: string;
  progress_percent: number;
}

export interface MergedChapter extends Chapter {
  completed: boolean;
  quiz_score: number | null;
  xano_is_locked: boolean;
}

// --- Helpers ---

function unwrapItem<T>(item: unknown): T {
  if (item && typeof item === 'object' && 'attributes' in item) {
    const attrs = (item as { attributes?: T }).attributes;
    const id = (item as { id?: number }).id;
    const documentId = (item as { documentId?: string }).documentId;
    return { ...(attrs as object), id, documentId } as T;
  }
  return item as T;
}

function fullUrl(base: string, path: string | undefined): string | null {
  if (!path || typeof path !== 'string') return null;
  const t = path.trim();
  if (!t) return null;
  return t.startsWith('http') ? t : `${base}${t}`;
}

async function strapiHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getStrapiApiToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function xanoHeaders(requireAuth = true): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (requireAuth) {
    const token = await getToken();
    if (!token) throw new Error('AUTH_REQUIRED');
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function handleXanoError(status: number, endpoint: string): Error {
  if (status === 401) return new Error('AUTH_REQUIRED');
  if (status === 403) return new Error('ACCESS_DENIED');
  if (status === 404) return new Error(`Not found: ${endpoint}`);
  return new Error(`Xano error ${status} on ${endpoint}`);
}

// --- Token / user storage (SecureStore) ---
// Primary auth token is managed by src/services/auth.ts (getToken/saveSession/logout).
// These helpers remain for backward compatibility with existing code.

export async function saveAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, String(token));
  await AsyncStorage.setItem('lifemonk_auth_token', String(token));
}

export async function getAuthToken(): Promise<string | null> {
  return await getToken();
}

export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
  await AsyncStorage.removeItem('lifemonk_auth_token');
  await AsyncStorage.removeItem('lifemonk_user');
}

export async function saveUser(user: StudentProfile): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  await AsyncStorage.setItem('lifemonk_user', JSON.stringify(user));
}

export async function getStoredUser(): Promise<StudentProfile | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StudentProfile;
  } catch {
    return null;
  }
}

// --- Strapi API ---

export async function getCategories(): Promise<Category[]> {
  const base = getStrapiBaseUrl();
  const headers = await strapiHeaders();
  try {
    const res = await fetch(
      `${base}/api/categories?populate[image]=true&filters[is_active][$eq]=true&sort=order:asc`,
      { headers }
    );
    if (!res.ok) throw new Error(`Strapi categories failed: ${res.status}`);
    const json = await res.json();
    const rawList = Array.isArray(json.data) ? json.data : json.data?.data ?? [];
    return rawList.map((item: unknown) => {
      const c = unwrapItem<{ id: number; documentId: string; name: string; description?: string; visibility?: string; image?: StrapiMedia; order?: number; is_active?: boolean }>(item);
      const imgUrl = c.image?.url;
      return {
        id: c.id ?? 0,
        documentId: c.documentId ?? '',
        name: c.name ?? '',
        description: c.description ?? null,
        visibility: c.visibility ?? 'all',
        image_url: fullUrl(base, imgUrl),
        order: c.order ?? 0,
        is_active: c.is_active ?? true,
      };
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Could not load categories.';
    throw new Error(msg);
  }
}

export async function fetchCourses(): Promise<Course[]> {
  const base = getStrapiBaseUrl();
  const headers = await strapiHeaders();
  try {
    const url = `${base}/api/courses?populate[category]=true&populate[cover_image]=true&populate[instructor_image]=true&filters[is_active][$eq]=true&sort=order:asc`;
    console.log('Strapi URL:', url);
    const res = await fetch(url, { headers });
    console.log('Strapi status:', res.status);
    if (!res.ok) throw new Error(`Strapi courses failed: ${res.status}`);
    const json = await res.json();
    const rawList = Array.isArray(json.data) ? json.data : json.data?.data ?? [];
    console.log('Strapi courses:', rawList.length);
    console.log('First raw course:', JSON.stringify(rawList[0] ?? null));
    if (rawList.length === 0) return [];
    return rawList.map((item: unknown) => {
      const course = unwrapItem<StrapiCourseRaw>(item);
      const categoryObj = course.category;
      const categoryName = categoryObj && typeof categoryObj === 'object' && 'name' in categoryObj ? (categoryObj as StrapiCategory)?.name : undefined;
      const categoryDocId = categoryObj && typeof categoryObj === 'object' && 'documentId' in categoryObj ? (categoryObj as StrapiCategory)?.documentId : undefined;
      const coverUrl = course.cover_image?.url;
      const instructorImg = course.instructor_image?.url;
      const grades = Array.isArray(course.grades) ? (course.grades as number[]) : [];
      return {
        id: course.id ?? 0,
        documentId: course.documentId ?? '',
        xanoCourseId: course.xano_course_id ?? null,
        title: course.title ?? '',
        short_description: course.short_description ?? '',
        description: course.description ?? '',
        cover_image_url: fullUrl(base, coverUrl),
        intro_video_url: course.intro_video_url ?? null,
        category: categoryName ?? 'General',
        category_id: categoryDocId ?? null,
        user_type_visibility: course.user_type_visibility ?? 'all',
        instructor_name: course.instructor_name ?? '',
        instructor_bio: course.instructor_bio ?? '',
        instructor_image_url: fullUrl(base, instructorImg),
        grades,
        is_active: course.is_active ?? true,
        order: course.order ?? 0,
        estimated_hours: course.estimated_hours ?? null,
      } as Course;
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Could not load courses.';
    throw new Error(msg);
  }
}

export async function getCourseById(strapiCourseId: string): Promise<Course | null> {
  const base = getStrapiBaseUrl();
  const headers = await strapiHeaders();
  try {
    const res = await fetch(
      `${base}/api/courses?documentId=${encodeURIComponent(strapiCourseId)}&populate[category]=true&populate[cover_image]=true&populate[instructor_image]=true`,
      { headers }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const rawList = Array.isArray(json.data) ? json.data : json.data?.data ?? [];
    const item = rawList[0];
    if (!item) return null;
    const course = unwrapItem<StrapiCourseRaw>(item);
    const categoryObj = course.category;
    const categoryName = categoryObj && typeof categoryObj === 'object' && 'name' in categoryObj ? (categoryObj as StrapiCategory)?.name : undefined;
    const categoryDocId = categoryObj && typeof categoryObj === 'object' && 'documentId' in categoryObj ? (categoryObj as StrapiCategory)?.documentId : undefined;
    const grades = Array.isArray(course.grades) ? (course.grades as number[]) : [];
    return {
      id: course.id ?? 0,
      documentId: course.documentId ?? '',
      xanoCourseId: course.xano_course_id ?? null,
      title: course.title ?? '',
      short_description: course.short_description ?? '',
      description: course.description ?? '',
      cover_image_url: fullUrl(base, course.cover_image?.url),
      intro_video_url: course.intro_video_url ?? null,
      category: categoryName ?? 'Uncategorized',
      category_id: categoryDocId ?? null,
      user_type_visibility: course.user_type_visibility ?? 'all',
      instructor_name: course.instructor_name ?? '',
      instructor_bio: course.instructor_bio ?? '',
      instructor_image_url: fullUrl(base, course.instructor_image?.url),
      grades,
      is_active: course.is_active ?? true,
      order: course.order ?? 0,
      estimated_hours: course.estimated_hours ?? null,
    } as Course;
  } catch {
    return null;
  }
}

export async function fetchChaptersByCourse(courseDocumentId: string): Promise<Chapter[]> {
  const base = getStrapiBaseUrl();
  const headers = await strapiHeaders();
  try {
    const url = `${base}/api/chapters?populate[course]=true&populate[thumbnail]=true&filters[course][documentId][$eq]=${encodeURIComponent(courseDocumentId)}&filters[is_active][$eq]=true&sort=order:asc`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Strapi chapters failed: ${res.status}`);
    const json = await res.json();
    const rawList = Array.isArray(json.data) ? json.data : json.data?.data ?? [];
    const validTypes = ['video', 'text', 'quiz', 'activity'];
    return rawList.map((item: unknown) => {
      const ch = unwrapItem<StrapiChapterRaw>(item);
      const rawType = ch.chapter_type ?? 'text';
      const safeType = validTypes.includes(rawType) ? rawType : 'text';
      return {
        id: ch.id ?? 0,
        documentId: ch.documentId ?? '',
        xanoCourseId: ch.xano_course_id ?? null,
        xanoChapterId: ch.xano_chapter_id ?? null,
        title: (ch.title ?? '').trim(),
        chapter_type: safeType as 'video' | 'text' | 'quiz' | 'activity',
        order: ch.order ?? 0,
        video_url: (ch.video_url ?? '').trim(),
        thumbnail_url: fullUrl(base, ch.thumbnail?.url),
        content: ch.content ?? '',
        duration_minutes: ch.duration_minutes ?? 0,
        is_locked: ch.is_locked ?? true,
        lock_depends_on_order: ch.lock_depends_on_order ?? 0,
        activity_instructions: ch.activity_instructions ?? '',
        activity_requires_proof: ch.activity_requires_proof ?? false,
      } as Chapter;
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Could not load chapters.';
    throw new Error(msg);
  }
}

function parseQuizQuestions(raw: unknown): QuizQuestion[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return []; } })() : [];
  return arr.map((q: unknown, i: number) => {
    const o = q as Record<string, unknown>;
    let options: string[] = [];
    if (Array.isArray(o.options)) options = o.options as string[];
    else if (typeof o.options === 'string') {
      try { options = JSON.parse(o.options); } catch { options = (o.options as string).split(',').map(s => s.trim()); }
    }
    return {
      id: (o.id as number) ?? i,
      question_text: (o.question_text as string) ?? (o.question as string) ?? '',
      options,
      correct_answer: (o.correct_answer as string | number) ?? 0,
      explanation: o.explanation as string | undefined,
    };
  });
}

export async function fetchQuizByChapter(chapterDocumentId: string): Promise<Quiz | null> {
  const base = getStrapiBaseUrl();
  const headers = await strapiHeaders();
  try {
    const res = await fetch(
      `${base}/api/quizzes?filters[chapter][documentId][$eq]=${encodeURIComponent(chapterDocumentId)}&populate=*`,
      { headers }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const rawList = Array.isArray(json.data) ? json.data : json.data?.data ?? [];
    const item = rawList[0];
    if (!item) return null;
    const attrs = unwrapItem<StrapiQuiz>(item);
    const questionsRaw = attrs.questions ?? (item as { attributes?: { questions?: unknown } }).attributes?.questions;
    return {
      id: attrs.id ?? 0,
      documentId: attrs.documentId ?? '',
      xanoChapterId: attrs.xano_chapter_id ?? null,
      title: attrs.title ?? '',
      pass_score: attrs.pass_score ?? 70,
      questions: parseQuizQuestions(questionsRaw),
    };
  } catch {
    return null;
  }
}

// --- Xano Auth (base URLs from config / .env) ---

export async function studentSignup(
  name: string,
  email: string,
  password: string,
  gradeId: number,
  schoolId: number,
  subscriptionType = 'basic'
): Promise<AuthResponse> {
  try {
    const authBase = getXanoAuthBaseUrl();
    if (!authBase) throw new Error('XANO_AUTH_URL not configured. Set EXPO_PUBLIC_XANO_AUTH_URL in .env');
    // Step 1: Create student
    const createRes = await fetch(`${authBase}/create_student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        grade_level: gradeId,
        subscription_type: subscriptionType,
      }),
    });
    const createText = await createRes.text();
    console.log('[studentSignup] create status:', createRes.status);
    console.log('[studentSignup] create response:', createText);
    const createData = createText ? JSON.parse(createText) : {};
    if (!createRes.ok) throw new Error(createData.message ?? 'Signup failed');

    // Step 2: Login to get token
    const loginRes = await fetch(`${authBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const loginData = await loginRes.json();
    console.log('[studentSignup] login status:', loginRes.status);
    console.log('[studentSignup] login response:', JSON.stringify(loginData));
    if (!loginRes.ok) throw new Error(loginData.message ?? 'Login after signup failed');

    await saveAuthToken(loginData.authToken);
    return {
      authToken: loginData.authToken,
      user: {
        id: loginData.id ?? createData.id,
        name: loginData.name ?? createData.name ?? name,
        email,
        grade_id: loginData.grade_id ?? gradeId,
        school_id: loginData.school_id ?? 0,
        subscription_type: loginData.subscription_type ?? subscriptionType,
      },
    };
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : 'Signup failed. Please try again.');
  }
}

export async function studentLogin(email: string, password: string): Promise<AuthResponse> {
  const authBase = getXanoAuthBaseUrl();
  if (!authBase) throw new Error('XANO_AUTH_URL not configured. Set EXPO_PUBLIC_XANO_AUTH_URL in .env');
  try {
    const res = await fetch(`${authBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    console.log('Login status:', res.status);
    const data = await res.json().catch(() => ({})) as AuthResponse & { message?: string };
    console.log('Login response:', JSON.stringify(data));
    if (!res.ok) throw new Error(data.message ?? 'Invalid email or password');
    await saveAuthToken(String(data.authToken));

    const meRes = await fetch(`${authBase}/auth/me`, {
      headers: { Authorization: 'Bearer ' + data.authToken },
    });
    const meData = (await meRes.json().catch(() => ({}))) as Record<string, unknown>;
    const userId = meData?.id ?? data?.id;
    const userName = meData?.name ?? data?.name ?? '';
    if (userId != null && Number(userId) > 0) {
      await SecureStore.setItemAsync('user_id', String(userId));
    }
    if (userName) {
      await SecureStore.setItemAsync('user_name', String(userName));
    }

    const user: StudentProfile = {
      id: Number(userId) || 0,
      name: String(userName || 'User'),
      email: String(meData?.email ?? data?.email ?? email),
      grade_id: Number(meData?.grade_id ?? meData?.grade ?? 0),
      school_id: Number(meData?.school_id ?? meData?.school ?? 0),
      subscription_type: String(meData?.subscription_type ?? data?.subscription_type ?? 'basic'),
    };

    return {
      authToken: String(data.authToken),
      user,
      id: user.id || (data as { id?: number }).id,
    };
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : 'Login failed. Please try again.');
  }
}

export async function getStudentProfile(): Promise<StudentProfile> {
  let token = await AsyncStorage.getItem('lifemonk_auth_token');
  if (!token) token = await getToken();
  if (!token) throw new Error('AUTH_REQUIRED');
  const authBase = getXanoAuthBaseUrl();
  if (!authBase) throw new Error('XANO_AUTH_URL not configured. Set EXPO_PUBLIC_XANO_AUTH_URL in .env');
  const res = await fetch(`${authBase}/auth/me`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw handleXanoError(res.status, '/auth/me');
  return (await res.json()) as StudentProfile;
}

export async function studentLogout(): Promise<void> {
  await clearAuthToken();
}

// --- Xano Course API (use Courses group base) ---

export async function getStudentCourses(): Promise<XanoCourseEntry[]> {
  const coursesBase = getXanoBaseUrl();
  const url = `${coursesBase}/get_user_courses`;
  try {
    let token = await AsyncStorage.getItem('lifemonk_auth_token');
    if (!token) token = await getToken();
    if (!token) return [];
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      await AsyncStorage.removeItem('lifemonk_auth_token');
      await AsyncStorage.removeItem('lifemonk_user');
      return [];
    }
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : (json as { courses?: XanoCourseEntry[] }).courses ?? json.data ?? [];
  } catch {
    return [];
  }
}

export async function getCoursesForCurrentStudent() {
  try {
    let token = await AsyncStorage.getItem('lifemonk_auth_token');
    if (!token) token = await getToken();
    if (!token) return [];
    const coursesBase = getXanoBaseUrl();
    const res = await fetch(`${coursesBase}/get_user_courses`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

/** Fetches from get_user_courses (course_grade + entitlement) as fallback when get_user_entitled_content returns 0. */
async function getCoursesFromUserCourses(studentId: number): Promise<Array<{ id?: number; course_id?: number; title?: string; category?: string; thumbnail_url?: string | null; strapi_document_id?: string | null; progress_percent?: number }>> {
  const coursesBase = getXanoBaseUrl();
  if (!coursesBase) return [];
  let token = await AsyncStorage.getItem('lifemonk_auth_token');
  if (!token) token = await getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(`${coursesBase.replace(/\/$/, '')}/get_user_courses?user_id=${studentId}`, { headers });
    if (!res.ok) return [];
    const json = await res.json();
    const arr = Array.isArray(json) ? json : (json as { courses?: unknown[] }).courses ?? json?.data ?? [];
    return arr.map((row: Record<string, unknown>) => ({
      id: row.id ?? row.course_id,
      course_id: row.course_id ?? row.id,
      title: row.title,
      category: row.category,
      thumbnail_url: row.thumbnail_url,
      strapi_document_id: row.strapi_document_id ?? row.strapi,
      progress_percent: row.progress_percent ?? 0,
    }));
  } catch {
    return [];
  }
}

/** Raw course or assignment item from Xano get_user_courses. Field names may vary. */
interface XanoUserCourseItem {
  id?: number;
  course_id?: number;
  title?: string;
  category?: string;
  thumbnail_url?: string | null;
  strapi?: string | null;
  strapi_document_id?: string | null;
  visibility_level?: string | null;
  description?: string | null;
  enrolled?: boolean;
  status?: string;
  progress_percent?: number;
  [key: string]: unknown;
}

/** Response from Xano get_user_entitled_content. Single source of truth for mobile content. */
export interface UserEntitledContentResponse {
  student: Record<string, unknown> | null;
  courses: Array<{
    id?: number;
    course_id?: number;
    title?: string;
    category?: string;
    thumbnail_url?: string | null;
    strapi_document_id?: string | null;
    progress_percent?: number;
    [key: string]: unknown;
  }>;
  workshops: unknown[];
  other_assets: unknown[];
}

/**
 * Fetches entitled content from Xano (single source of truth). Used by the app for the main content list.
 * No filtering on frontend; Xano returns only what the student is entitled to.
 */
export async function getUserEntitledContent(studentId: number): Promise<UserEntitledContentResponse> {
  const coursesBase = getXanoBaseUrl();
  if (!coursesBase) {
    console.warn('[getUserEntitledContent] XANO_BASE_URL not set');
    return { student: null, courses: [], workshops: [], other_assets: [] };
  }
  let token = await AsyncStorage.getItem('lifemonk_auth_token');
  if (!token) token = await getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const url = `${coursesBase.replace(/\/$/, '')}/get_user_entitled_content?student_id=${encodeURIComponent(studentId)}`;
  try {
    const res = await fetch(url, { headers });
    const json = (await res.json().catch(() => ({}))) as UserEntitledContentResponse & { message?: string; error?: string };
    if (!res.ok) {
      const errBody = JSON.stringify(json).slice(0, 500);
      console.warn(
        '[getUserEntitledContent] failed:',
        'status=', res.status,
        'url=', url,
        'body=', errBody
      );
      if (res.status === 401) {
        await AsyncStorage.removeItem('lifemonk_auth_token');
        await AsyncStorage.removeItem('lifemonk_user');
      }
      return { student: null, courses: [], workshops: [], other_assets: [] };
    }
    const courses = Array.isArray(json?.courses) ? json.courses : [];
    const isEmptyOk = courses.length === 0 && res.ok;
    console.log(
      '[getUserEntitledContent] student_id=', studentId,
      'courses=', courses.length,
      'student=', json?.student ? 'ok' : 'null',
      isEmptyOk ? '(empty = no entitlements)' : ''
    );
    return {
      student: json?.student ?? null,
      courses,
      workshops: Array.isArray(json?.workshops) ? json.workshops : [],
      other_assets: Array.isArray(json?.other_assets) ? json.other_assets : [],
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('[getUserEntitledContent] fetch failed:', url, msg);
    return { student: null, courses: [], workshops: [], other_assets: [] };
  }
}

/**
 * Fetches course list from Xano via get_user_entitled_content only. Returns MergedCourse[] for the Learn page.
 * No fallback to Strapi or get_all_courses. Empty or error => empty array; UI shows empty state.
 */
export async function getXanoCatalogCourses(): Promise<MergedCourse[]> {
  let token = await AsyncStorage.getItem('lifemonk_auth_token');
  if (!token) token = await getToken();
  if (!token) return [];
  let studentId: number | null = null;
  const student = await getCurrentStudent();
  if (student && student.id != null) studentId = student.id;
  if (studentId == null) {
    const storedUserId = await getUserId();
    studentId = storedUserId ? parseInt(String(storedUserId), 10) : 0;
  }
  if (!studentId || studentId <= 0) {
    const hydrated = await fetchAndPersistUserIdFromAuthMe();
    if (hydrated != null && hydrated > 0) studentId = hydrated;
  }
  if (!studentId || studentId <= 0) {
    console.warn('[getXanoCatalogCourses] No valid student_id. Resolved id=', studentId);
    return [];
  }

  try {
    let response = await getUserEntitledContent(studentId);
    let rawList = response.courses ?? [];

    if (rawList.length === 0) {
      const fallback = await getCoursesFromUserCourses(studentId);
      if (fallback.length > 0) {
        console.log('[getXanoCatalogCourses] get_user_entitled_content returned 0; using get_user_courses fallback');
        rawList = fallback;
      }
    }

    return rawList.map((row) => {
      const xanoId = Number(row.id ?? row.course_id ?? 0);
      const documentId =
        (typeof row.strapi_document_id === 'string' && row.strapi_document_id.trim()
          ? row.strapi_document_id.trim()
          : null) ?? '';
      const course: Course = {
        id: xanoId,
        documentId,
        xanoCourseId: xanoId,
        title: typeof row.title === 'string' ? row.title : 'Untitled',
        short_description: typeof row.description === 'string' ? row.description.slice(0, 200) : '',
        description: typeof row.description === 'string' ? row.description : '',
        cover_image_url: typeof row.thumbnail_url === 'string' && row.thumbnail_url ? row.thumbnail_url : null,
        intro_video_url: null,
        category: typeof row.category === 'string' ? row.category : 'Uncategorized',
        category_id: null,
        user_type_visibility: 'all',
        instructor_name: '',
        instructor_bio: '',
        instructor_image_url: null,
        grades: [],
        is_active: true,
        order: 0,
        estimated_hours: null,
      };
      return {
        ...course,
        enrolled: true,
        status: 'enrolled',
        progress_percent: typeof row.progress_percent === 'number' ? row.progress_percent : 0,
      } as MergedCourse;
    });
  } catch {
    return [];
  }
}

export async function enrollCourse(xanoCourseId: number): Promise<void> {
  const headers = await xanoHeaders(true);
  const coursesBase = getXanoBaseUrl();
  const res = await fetch(`${coursesBase}/enroll_course`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ course_id: xanoCourseId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 400 && (err as { message?: string }).message?.includes('enrolled')) return;
    throw handleXanoError(res.status, '/enroll_course');
  }
}

export async function getCourseProgress(xanoCourseId: number): Promise<XanoCourseProgress | null> {
  const headers = await xanoHeaders(true);
  const coursesBase = getXanoBaseUrl();
  try {
    const res = await fetch(`${coursesBase}/get_course_progress?course_id=${xanoCourseId}`, { headers });
    if (!res.ok) return null;
    return (await res.json()) as XanoCourseProgress;
  } catch {
    return null;
  }
}

export async function completeChapter(
  xanoChapterId: number,
  watchTimeSeconds = 0,
  quizScore?: number
): Promise<void> {
  const headers = await xanoHeaders(true);
  const coursesBase = getXanoBaseUrl();
  const res = await fetch(`${coursesBase}/complete_chapter`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      chapter_id: xanoChapterId,
      watch_time_seconds: watchTimeSeconds,
      quiz_score: quizScore ?? null,
    }),
  });
  if (!res.ok) throw handleXanoError(res.status, '/complete_chapter');
}

export async function submitQuizAttempt(
  xanoChapterId: number,
  xanoCourseId: number,
  answers: Array<{ question_index: number; selected_answer: string | number }>,
  score: number,
  totalQuestions: number,
  correctAnswers: number
): Promise<{ score: number; passed: boolean; pass_score: number }> {
  const headers = await xanoHeaders(true);
  const coursesBase = getXanoBaseUrl();
  const res = await fetch(`${coursesBase}/submit_quiz_attempt`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      chapter_id: xanoChapterId,
      course_id: xanoCourseId,
      answers: JSON.stringify(answers),
      score,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
    }),
  });
  if (!res.ok) throw handleXanoError(res.status, '/submit_quiz_attempt');
  return (await res.json()) as { score: number; passed: boolean; pass_score: number };
}

export async function issueCertificate(xanoCourseId: number): Promise<void> {
  const headers = await xanoHeaders(true);
  const coursesBase = getXanoBaseUrl();
  const res = await fetch(`${coursesBase}/issue_certificate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ course_id: xanoCourseId }),
  });
  if (!res.ok) throw handleXanoError(res.status, '/issue_certificate');
}

// --- Merged data ---

export async function getHomeScreenCourses(): Promise<MergedCourse[]> {
  try {
    const [strapiResult, xanoResult] = await Promise.allSettled([
      fetchCourses(),
      getStudentCourses(),
    ]);
    console.log('Strapi result:', strapiResult.status);
    console.log('Xano result:', xanoResult.status);
    const courses = strapiResult.status === 'fulfilled' ? strapiResult.value : [];
    const xanoData = xanoResult.status === 'fulfilled' ? xanoResult.value : [];
    const merged = courses.map((course) => {
      const xanoEntry = course.xanoCourseId
        ? xanoData.find((x) => x.course_id === course.xanoCourseId)
        : undefined;
      return {
        ...course,
        enrolled: xanoEntry?.enrolled ?? false,
        status: xanoEntry?.status ?? 'not_enrolled',
        progress_percent: xanoEntry?.progress_percent ?? 0,
      } as MergedCourse;
    });
    console.log('Final merged count:', merged.length);
    return merged;
  } catch {
    return [];
  }
}

export async function getCourseDetail(
  courseDocumentId: string,
  xanoCourseId: number | null
): Promise<{ chapters: MergedChapter[]; progress: XanoCourseProgress | null }> {
  try {
    const [strapiChapters, xanoProgress] = await Promise.allSettled([
      fetchChaptersByCourse(courseDocumentId),
      xanoCourseId ? getCourseProgress(xanoCourseId) : Promise.resolve(null),
    ]);
    const chapters = strapiChapters.status === 'fulfilled' ? strapiChapters.value : [];
    const progress = xanoProgress.status === 'fulfilled' ? xanoProgress.value : null;
    const mergedChapters: MergedChapter[] = chapters.map((ch) => {
      const xanoCh = progress?.chapters?.find((xc) => xc.chapter_id === ch.xanoChapterId);
      return {
        ...ch,
        completed: xanoCh?.completed ?? false,
        quiz_score: xanoCh?.quiz_score ?? null,
        xano_is_locked: xanoCh ? !xanoCh.completed && ch.lock_depends_on_order > 0 : ch.is_locked,
      };
    });
    return { chapters: mergedChapters, progress };
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : 'Could not load course details.');
  }
}