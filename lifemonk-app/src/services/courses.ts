/**
 * LifeMonk — Courses Service
 * Strapi = content (titles, thumbnails, chapters, quiz). Xano = auth, enrollment, progress.
 * Uses env: STRAPI_BASE_URL, STRAPI_API_TOKEN (optional), XANO_BASE_URL.
 * Auth token stored in SecureStore via auth.ts.
 */

import * as SecureStore from 'expo-secure-store';
import { getStrapiBaseUrl, getStrapiApiToken, getXanoBaseUrl } from './config';
import { getCurrentStudent, getToken, getUserId } from './auth';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_KEY = 'lifemonk_user';
const XANO_COURSES_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:j1bkW6GC';

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
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function getAuthToken(): Promise<string | null> {
  return await getToken();
}

export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function saveUser(user: StudentProfile): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
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
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Strapi courses failed: ${res.status}`);
    const json = await res.json();
    const rawList = Array.isArray(json.data) ? json.data : json.data?.data ?? [];
    return rawList.map((item: unknown) => {
      const course = unwrapItem<StrapiCourseRaw>(item);
      const categoryObj = course.category;
      const categoryName = categoryObj && typeof categoryObj === 'object' && 'name' in categoryObj ? (categoryObj as StrapiCategory).name : undefined;
      const categoryDocId = categoryObj && typeof categoryObj === 'object' && 'documentId' in categoryObj ? (categoryObj as StrapiCategory).documentId : undefined;
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
        category: categoryName ?? 'Uncategorized',
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
    const categoryName = categoryObj && typeof categoryObj === 'object' && 'name' in categoryObj ? (categoryObj as StrapiCategory).name : undefined;
    const categoryDocId = categoryObj && typeof categoryObj === 'object' && 'documentId' in categoryObj ? (categoryObj as StrapiCategory).documentId : undefined;
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

// --- Xano Auth ---

export async function studentSignup(
  name: string,
  email: string,
  password: string,
  gradeId: number,
  schoolId: number,
  subscriptionType = 'basic'
): Promise<AuthResponse> {
  const base = getXanoBaseUrl();
  try {
    const res = await fetch(`${base}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, grade_id: gradeId, school_id: schoolId, subscription_type: subscriptionType }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message ?? `Signup failed: ${res.status}`);
    }
    const data = (await res.json()) as AuthResponse;
    await saveAuthToken(data.authToken);
    await saveUser(data.user);
    return data;
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : 'Signup failed. Please try again.');
  }
}

export async function studentLogin(email: string, password: string): Promise<AuthResponse> {
  const base = getXanoBaseUrl();
  try {
    const res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message ?? 'Invalid email or password');
    }
    const data = (await res.json()) as AuthResponse;
    await saveAuthToken(data.authToken);
    await saveUser(data.user);
    return data;
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : 'Login failed. Please try again.');
  }
}

export async function getStudentProfile(): Promise<StudentProfile> {
  const base = getXanoBaseUrl();
  const headers = await xanoHeaders(true);
  const res = await fetch(`${base}/auth/me`, { headers });
  if (!res.ok) throw handleXanoError(res.status, '/auth/me');
  return (await res.json()) as StudentProfile;
}

export async function studentLogout(): Promise<void> {
  await clearAuthToken();
}

// --- Xano Course API (JWT + xano IDs) ---

export async function getStudentCourses(): Promise<XanoCourseEntry[]> {
  const base = getXanoBaseUrl();
  const headers = await xanoHeaders(true);
  const res = await fetch(`${base}/get_student_enrollments`, { headers });
  if (!res.ok) throw handleXanoError(res.status, '/get_student_enrollments');
  const json = await res.json();
  return Array.isArray(json) ? json : (json as { courses?: XanoCourseEntry[] }).courses ?? json.data ?? [];
}

export async function getCoursesForCurrentStudent() {
  try {
    const student = await getCurrentStudent();
    if (!student) return [];

    const token = await getToken();
    const res = await fetch(
      XANO_COURSES_URL + '/get_user_courses?user_id=' + student.id,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
      }
    );
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

export async function enrollCourse(xanoCourseId: number): Promise<void> {
  const base = getXanoBaseUrl();
  const headers = await xanoHeaders(true);
  const res = await fetch(`${base}/enroll_course`, {
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
  const base = getXanoBaseUrl();
  const headers = await xanoHeaders(true);
  try {
    const res = await fetch(`${base}/get_course_progress?course_id=${xanoCourseId}`, { headers });
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
  const base = getXanoBaseUrl();
  const headers = await xanoHeaders(true);
  const res = await fetch(`${base}/complete_chapter`, {
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
  const base = getXanoBaseUrl();
  const headers = await xanoHeaders(true);
  const res = await fetch(`${base}/submit_quiz_attempt`, {
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
  const base = getXanoBaseUrl();
  const headers = await xanoHeaders(true);
  const res = await fetch(`${base}/issue_certificate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ course_id: xanoCourseId }),
  });
  if (!res.ok) throw handleXanoError(res.status, '/issue_certificate');
}

// --- Merged data ---

export async function getHomeScreenCourses(): Promise<MergedCourse[]> {
  try {
    const [strapiCourses, xanoCourses] = await Promise.allSettled([
      fetchCourses(),
      getStudentCourses().catch(() => []),
    ]);
    const courses = strapiCourses.status === 'fulfilled' ? strapiCourses.value : [];
    const xanoData = xanoCourses.status === 'fulfilled' ? xanoCourses.value : [];
    return courses.map((course) => {
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
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : 'Could not load courses.');
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
