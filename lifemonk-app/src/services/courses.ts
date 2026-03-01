/**
 * Courses API - Strapi (content) + Xano (user progress, enrollment)
 */

const STRAPI_BASE = 'http://192.168.1.22:1337';
const XANO_BASE = 'https://x8ki-letl-twmt.n7.xano.io/api:j1bkW6GC';

const DEFAULT_USER_ID = 1;
const DEFAULT_USER_TYPE = 'ultra';

// --- Strapi raw types (API response shape) ---

type StrapiCategory = {
  id?: number;
  documentId?: string;
  name?: string;
  visibility?: string;
} | null;

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
  assigned_schools?: unknown[];
  is_active?: boolean;
  order?: number;
  estimated_hours?: number | null;
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
}

export interface StrapiQuizQuestion {
  id?: number;
  question_text: string;
  options?: string[] | string;
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

// --- Helpers: unwrap Strapi v4 attributes if present ---

function unwrapItem<T>(item: unknown): T {
  if (item && typeof item === 'object' && 'attributes' in item) {
    const attrs = (item as { attributes?: T }).attributes;
    const id = (item as { id?: number }).id;
    const documentId = (item as { documentId?: string }).documentId;
    return { ...(attrs as object), id, documentId } as T;
  }
  return item as T;
}

function fullUrl(path: string | undefined): string | null {
  if (!path || typeof path !== 'string') return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  return trimmed.startsWith('http') ? trimmed : `${STRAPI_BASE}${trimmed}`;
}

// --- Strapi API ---

export async function fetchCourses(): Promise<Course[]> {
  try {
    const url = `${STRAPI_BASE}/api/courses?populate[category]=true&populate[cover_image]=true&populate[instructor_image]=true&filters[is_active][$eq]=true&sort=order:asc`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch courses: ${res.status}`);
    const json = await res.json();
    const rawList = Array.isArray(json.data) ? json.data : json.data?.data ?? [];
    return rawList.map((item: unknown) => {
      const course = unwrapItem<StrapiCourseRaw>(item);
      const categoryObj = course.category;
      const categoryName = categoryObj && typeof categoryObj === 'object' && 'name' in categoryObj
        ? (categoryObj as StrapiCategory).name
        : undefined;
      const categoryDocId = categoryObj && typeof categoryObj === 'object' && 'documentId' in categoryObj
        ? (categoryObj as StrapiCategory).documentId
        : undefined;
      const coverUrl = course.cover_image && typeof course.cover_image === 'object' && 'url' in course.cover_image
        ? course.cover_image.url
        : undefined;
      const instructorImg = course.instructor_image && typeof course.instructor_image === 'object' && 'url' in course.instructor_image
        ? course.instructor_image.url
        : undefined;
      const grades = Array.isArray(course.grades) ? course.grades : [];
      return {
        id: course.id ?? 0,
        documentId: course.documentId ?? '',
        title: course.title ?? '',
        short_description: course.short_description ?? '',
        description: course.description ?? '',
        cover_image_url: fullUrl(coverUrl),
        intro_video_url: course.intro_video_url ?? null,
        category: categoryName ?? 'Uncategorized',
        category_id: categoryDocId ?? null,
        user_type_visibility: course.user_type_visibility ?? 'all',
        instructor_name: course.instructor_name ?? '',
        instructor_bio: course.instructor_bio ?? '',
        instructor_image_url: fullUrl(instructorImg),
        grades,
        is_active: course.is_active ?? true,
        order: course.order ?? 0,
        estimated_hours: course.estimated_hours ?? null,
      };
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not load courses. Please try again.';
    throw new Error(message);
  }
}

export async function fetchChaptersByCourse(courseDocumentId: string): Promise<Chapter[]> {
  try {
    const url = `${STRAPI_BASE}/api/chapters?populate[course]=true&populate[thumbnail]=true&filters[course][documentId][$eq]=${encodeURIComponent(courseDocumentId)}&sort=order:asc&filters[is_active][$eq]=true`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch chapters: ${res.status}`);
    const json = await res.json();
    const rawList = Array.isArray(json.data) ? json.data : json.data?.data ?? [];
    return rawList.map((item: unknown) => {
      const ch = unwrapItem<StrapiChapterRaw>(item);
      const thumbUrl = ch.thumbnail && typeof ch.thumbnail === 'object' && 'url' in ch.thumbnail
        ? ch.thumbnail.url
        : undefined;
      const chapterType = (ch.chapter_type ?? 'text') as 'video' | 'text' | 'quiz' | 'activity';
      const validTypes = ['video', 'text', 'quiz', 'activity'];
      const safeType = validTypes.includes(chapterType) ? chapterType : 'text';
      return {
        id: ch.id ?? 0,
        documentId: ch.documentId ?? '',
        title: (ch.title ?? '').trim(),
        chapter_type: safeType,
        order: ch.order ?? 0,
        video_url: (ch.video_url ?? '').trim(),
        thumbnail_url: fullUrl(thumbUrl),
        content: ch.content ?? '',
        duration_minutes: ch.duration_minutes ?? 0,
        is_locked: ch.is_locked ?? true,
        lock_depends_on_order: ch.lock_depends_on_order ?? 0,
        activity_instructions: ch.activity_instructions ?? '',
        activity_requires_proof: ch.activity_requires_proof ?? false,
      };
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not load chapters. Please try again.';
    throw new Error(message);
  }
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
  try {
    const res = await fetch(
      `${STRAPI_BASE}/api/quizzes?filters[chapter][documentId][$eq]=${encodeURIComponent(chapterDocumentId)}&populate=*`
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
      title: attrs.title ?? '',
      pass_score: attrs.pass_score ?? 100,
      questions: parseQuizQuestions(questionsRaw),
    };
  } catch {
    return null;
  }
}

// --- Xano API ---

export async function getUserCourses(userId: number = DEFAULT_USER_ID): Promise<UserCourseEntry[]> {
  try {
    const res = await fetch(`${XANO_BASE}/get_user_courses?user_id=${userId}`);
    if (!res.ok) throw new Error(`Failed to get user courses: ${res.status}`);
    const json = await res.json();
    return Array.isArray(json) ? json : json.data ?? [];
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not load your courses. Please try again.';
    throw new Error(message);
  }
}

export async function enrollCourse(
  userId: number,
  strapiCourseId: string
): Promise<void> {
  try {
    const res = await fetch(`${XANO_BASE}/enroll_course`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, strapi_course_id: strapiCourseId }),
    });
    if (!res.ok) throw new Error(`Enroll failed: ${res.status}`);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Enrollment failed. Please try again.';
    throw new Error(message);
  }
}

export async function getCourseProgress(
  userId: number,
  strapiCourseId: string
): Promise<CourseProgress | null> {
  try {
    const res = await fetch(
      `${XANO_BASE}/get_course_progress?user_id=${userId}&strapi_course_id=${encodeURIComponent(strapiCourseId)}`
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json as CourseProgress;
  } catch {
    return null;
  }
}

export async function completeChapter(
  userId: number,
  strapiCourseId: string,
  strapiChapterId: string,
  chapterOrder: number,
  quizScore?: number,
  proofUrl?: string
): Promise<void> {
  try {
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
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not save progress. Please try again.';
    throw new Error(message);
  }
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
  try {
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
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not submit quiz. Please try again.';
    throw new Error(message);
  }
}

export async function issueCertificate(
  userId: number,
  strapiCourseId: string
): Promise<void> {
  try {
    const res = await fetch(`${XANO_BASE}/issue_certificate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, strapi_course_id: strapiCourseId }),
    });
    if (!res.ok) throw new Error(`Issue certificate failed: ${res.status}`);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not issue certificate. Please try again.';
    throw new Error(message);
  }
}

export { DEFAULT_USER_ID, DEFAULT_USER_TYPE };
