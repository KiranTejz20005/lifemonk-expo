/**
 * Courses API - Strapi (content) + Xano (user progress, enrollment)
 */

const STRAPI_BASE = 'http://192.168.1.22:1337';
const XANO_BASE = 'https://x8ki-letl-twmt.n7.xano.io/api:j1bkW6GC';

const DEFAULT_USER_ID = 1;

// --- Strapi types (from API responses) ---

function strapiMediaUrl(obj: unknown): string {
  if (typeof obj === 'string') return obj;
  if (obj && typeof obj === 'object' && 'url' in obj && typeof (obj as { url: string }).url === 'string') {
    const url = (obj as { url: string }).url;
    return url.startsWith('http') ? url : `${STRAPI_BASE}${url}`;
  }
  return '';
}

function strapiAttr<T>(item: { attributes?: T } | T): T {
  if (item && typeof item === 'object' && 'attributes' in item) {
    return (item as { attributes: T }).attributes as T;
  }
  return item as T;
}

export interface StrapiCourse {
  id: number;
  documentId: string;
  title: string;
  short_description?: string;
  category?: string;
  user_type_visibility?: string;
  instructor_name?: string;
  instructor_bio?: string;
  instructor_image?: unknown;
  cover_image?: unknown;
  intro_video_url?: string;
  assigned_grades?: string;
  order?: number;
  estimated_hours?: number;
  is_active?: boolean;
}

export interface StrapiChapter {
  id: number;
  documentId: string;
  title: string;
  chapter_type: 'video' | 'text' | 'quiz' | 'activity';
  order: number;
  video_url?: string;
  content?: string;
  duration_minutes?: number;
  is_locked?: boolean;
  lock_depends_on_order?: number;
  activity_instructions?: string;
  activity_requires_proof?: boolean;
}

export interface StrapiQuizQuestion {
  id?: number;
  question_text: string;
  options?: string[] | string; // JSON array or comma-separated
  correct_answer?: string | number;
}

export interface StrapiQuiz {
  id: number;
  documentId: string;
  title: string;
  pass_score?: number;
  questions?: StrapiQuizQuestion[] | unknown;
}

// --- Normalized types for UI ---

export interface Course {
  id: number;
  documentId: string;
  title: string;
  short_description: string;
  category: string;
  instructor_name: string;
  instructor_bio: string;
  instructor_image: string;
  cover_image: string;
  intro_video_url: string;
  estimated_hours?: number;
  order: number;
}

export interface Chapter {
  id: number;
  documentId: string;
  title: string;
  chapter_type: 'video' | 'text' | 'quiz' | 'activity';
  order: number;
  video_url: string;
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
}

export interface Quiz {
  id: number;
  documentId: string;
  title: string;
  pass_score: number;
  questions: QuizQuestion[];
}

// --- Xano types ---

export interface UserCourseEntry {
  strapi_course_id: string;
  enrolled: boolean;
  status?: string;
  progress_percent: number;
}

export interface ChapterProgress {
  strapi_chapter_id: string;
  is_completed: boolean;
  quiz_score?: number;
  quiz_passed?: boolean;
}

export interface CourseProgress {
  status: string;
  progress_percent: number;
  certificate_issued?: boolean;
  chapters: ChapterProgress[];
}

// --- Strapi API ---

export async function fetchCourses(): Promise<Course[]> {
  const res = await fetch(
    `${STRAPI_BASE}/api/courses?populate=*&filters[is_active][$eq]=true&sort=order:asc`
  );
  if (!res.ok) throw new Error(`Failed to fetch courses: ${res.status}`);
  const json = await res.json();
  const rawList = Array.isArray(json.data) ? json.data : json.data?.data ?? [];
  return rawList.map((item: unknown) => {
    const attrs = strapiAttr(item as { attributes?: StrapiCourse }) as StrapiCourse;
    const id = (item as { id?: number }).id ?? attrs.id ?? 0;
    const docId = (item as { documentId?: string }).documentId ?? attrs.documentId ?? '';
    return {
      id,
      documentId: docId,
      title: attrs.title ?? '',
      short_description: attrs.short_description ?? '',
      category: attrs.category ?? 'foundation',
      instructor_name: attrs.instructor_name ?? '',
      instructor_bio: attrs.instructor_bio ?? '',
      instructor_image: strapiMediaUrl(attrs.instructor_image),
      cover_image: strapiMediaUrl(attrs.cover_image),
      intro_video_url: typeof attrs.intro_video_url === 'string' ? attrs.intro_video_url : '',
      estimated_hours: attrs.estimated_hours,
      order: attrs.order ?? 0,
    };
  });
}

/** Get course documentId from a chapter item (Strapi relation) */
function getChapterCourseDocumentId(item: unknown): string | null {
  const attrs = (item as { attributes?: { course?: unknown } }).attributes;
  if (!attrs?.course) return null;
  const c = attrs.course as { documentId?: string; data?: { documentId?: string } };
  return c.documentId ?? c.data?.documentId ?? null;
}

export async function fetchChaptersByCourse(documentId: string): Promise<Chapter[]> {
  const url = `${STRAPI_BASE}/api/chapters?populate=*&sort=order:asc`;
  console.log('[fetchChaptersByCourse] Full URL:', url);
  const res = await fetch(url);
  const json = await res.json();
  console.log('[fetchChaptersByCourse] Response status:', res.status, 'body:', JSON.stringify(json, null, 2));
  if (!res.ok) throw new Error(`Failed to fetch chapters: ${res.status}`);
  const rawList = Array.isArray(json.data) ? json.data : json.data?.data ?? [];
  // Fetching ALL chapters (no filter) to confirm API works; filter client-side by course
  const filtered = rawList.filter((item: unknown) => {
    const courseDocId = getChapterCourseDocumentId(item);
    return courseDocId === documentId;
  });
  console.log('[fetchChaptersByCourse] Requested documentId:', documentId, 'raw count:', rawList.length, 'filtered count:', filtered.length);
  // Return filtered; if filtered is empty, return all so we can confirm API (debug)
  const toMap = filtered.length > 0 ? filtered : rawList;
  return toMap.map((item: unknown) => {
    const attrs = strapiAttr(item as { attributes?: StrapiChapter }) as StrapiChapter;
    const id = (item as { id?: number }).id ?? attrs.id ?? 0;
    const docId = (item as { documentId?: string }).documentId ?? attrs.documentId ?? '';
    return {
      id,
      documentId: docId,
      title: attrs.title ?? '',
      chapter_type: attrs.chapter_type ?? 'text',
      order: attrs.order ?? 0,
      video_url: (typeof attrs.video_url === 'string' ? attrs.video_url : '').trim(),
      content: typeof attrs.content === 'string' ? attrs.content : '',
      duration_minutes: attrs.duration_minutes ?? 0,
      is_locked: attrs.is_locked ?? false,
      lock_depends_on_order: attrs.lock_depends_on_order ?? 0,
      activity_instructions: typeof attrs.activity_instructions === 'string' ? attrs.activity_instructions : '',
      activity_requires_proof: attrs.activity_requires_proof ?? false,
    };
  });
}

function parseQuizQuestions(raw: unknown): QuizQuestion[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : (typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return []; } })() : []);
  return arr.map((q: unknown, i: number) => {
    const o = q as Record<string, unknown>;
    let options: string[] = [];
    if (Array.isArray(o.options)) options = o.options as string[];
    else if (typeof o.options === 'string') {
      try { options = JSON.parse(o.options as string); } catch { options = (o.options as string).split(',').map(s => s.trim()); }
    }
    return {
      id: (o.id as number) ?? i,
      question_text: (o.question_text as string) ?? '',
      options,
      correct_answer: (o.correct_answer as string | number) ?? '',
    };
  });
}

export async function fetchQuizByChapter(chapterDocumentId: string): Promise<Quiz | null> {
  const res = await fetch(
    `${STRAPI_BASE}/api/quizzes?filters[chapter][documentId][$eq]=${encodeURIComponent(chapterDocumentId)}&populate=*`
  );
  if (!res.ok) throw new Error(`Failed to fetch quiz: ${res.status}`);
  const json = await res.json();
  const rawList = Array.isArray(json.data) ? json.data : json.data?.data ?? [];
  const item = rawList[0];
  if (!item) return null;
  const attrs = strapiAttr(item as { attributes?: StrapiQuiz }) as StrapiQuiz;
  const questionsRaw = attrs.questions ?? (item as { attributes?: { questions?: unknown } }).attributes?.questions;
  return {
    id: (item as { id?: number }).id ?? attrs.id ?? 0,
    documentId: (item as { documentId?: string }).documentId ?? (attrs as unknown as { documentId?: string }).documentId ?? '',
    title: attrs.title ?? '',
    pass_score: attrs.pass_score ?? 100,
    questions: parseQuizQuestions(questionsRaw),
  };
}

// --- Xano API ---

export async function getUserCourses(userId: number = DEFAULT_USER_ID): Promise<UserCourseEntry[]> {
  const res = await fetch(`${XANO_BASE}/get_user_courses?user_id=${userId}`);
  if (!res.ok) throw new Error(`Failed to get user courses: ${res.status}`);
  const json = await res.json();
  return Array.isArray(json) ? json : json.data ?? [];
}

export async function enrollCourse(
  userId: number,
  strapiCourseId: string
): Promise<void> {
  const res = await fetch(`${XANO_BASE}/enroll_course`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, strapi_course_id: strapiCourseId }),
  });
  if (!res.ok) throw new Error(`Enroll failed: ${res.status}`);
}

export async function getCourseProgress(
  userId: number,
  strapiCourseId: string
): Promise<CourseProgress | null> {
  const res = await fetch(
    `${XANO_BASE}/get_course_progress?user_id=${userId}&strapi_course_id=${encodeURIComponent(strapiCourseId)}`
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json as CourseProgress;
}

export async function completeChapter(
  userId: number,
  strapiCourseId: string,
  strapiChapterId: string,
  chapterOrder: number,
  quizScore?: number,
  proofUrl?: string
): Promise<void> {
  const res = await fetch(`${XANO_BASE}/complete_chapter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      strapi_course_id: strapiCourseId,
      strapi_chapter_id: strapiChapterId,
      chapter_order: chapterOrder,
      quiz_score: quizScore ?? null,
      activity_proof_url: proofUrl ?? null,
    }),
  });
  if (!res.ok) throw new Error(`Complete chapter failed: ${res.status}`);
}

export async function submitQuiz(
  userId: number,
  strapiCourseId: string,
  strapiChapterId: string,
  score: number,
  totalQuestions: number,
  correctAnswers: number,
  answers: string
): Promise<void> {
  const res = await fetch(`${XANO_BASE}/submit_quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      strapi_course_id: strapiCourseId,
      strapi_chapter_id: strapiChapterId,
      score,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      answers,
    }),
  });
  if (!res.ok) throw new Error(`Submit quiz failed: ${res.status}`);
}

export async function issueCertificate(
  userId: number,
  strapiCourseId: string
): Promise<void> {
  const res = await fetch(`${XANO_BASE}/issue_certificate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, strapi_course_id: strapiCourseId }),
  });
  if (!res.ok) throw new Error(`Issue certificate failed: ${res.status}`);
}

export { DEFAULT_USER_ID };
