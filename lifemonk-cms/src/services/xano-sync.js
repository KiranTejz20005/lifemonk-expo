'use strict';

/**
 * Xano sync service: syncs Strapi course and chapters to Xano on publish.
 * - Uses POST sync_course (courses API group) for course; then POST/PATCH chapter per chapter (Option B).
 * - All requests go through xano-client (env-based URLs, logging, error hints).
 * - Never throws — logs errors so Strapi does not crash.
 */

const xano = require('./xano-client');

const STRAPI_URL = (typeof process !== 'undefined' && process.env.STRAPI_URL) || 'http://localhost:1337';

/** Strapi user_type_visibility → Xano visibility_level */
const VISIBILITY_MAP = {
  all: 'public',
  premium: 'restricted',
  ultra: 'hidden',
};

function getFullUrl(relativePath) {
  if (!relativePath || typeof relativePath !== 'string') return null;
  const trimmed = relativePath.trim();
  if (!trimmed) return null;
  return trimmed.startsWith('http') ? trimmed : `${STRAPI_URL.replace(/\/$/, '')}${trimmed.startsWith('/') ? trimmed : '/' + trimmed}`;
}

/**
 * Build sync_course payload from Strapi course (with optional populated category and chapters).
 * @param {object} course - Strapi course (category, chapters may be populated)
 * @returns {object} payload for POST sync_course
 */
function buildSyncCoursePayload(course) {
  const visibilityLevel = VISIBILITY_MAP[course.user_type_visibility] || 'public';
  const chapters = Array.isArray(course.chapters) ? course.chapters : [];
  const totalChapters = chapters.length;
  const description = typeof course.description === 'string'
    ? course.description
    : (course.description && course.description.data != null ? String(course.description.data) : '');
  const thumbnailUrl = course.cover_image && course.cover_image.url
    ? getFullUrl(course.cover_image.url)
    : null;
  const strapiDocumentId = course.strapi_document_id || course.documentId || String(course.id);

  return {
    strapi_document_id: strapiDocumentId,
    title: course.title || '',
    category: (course.category && (course.category.name || course.category.id)) || 'general',
    visibility_level: visibilityLevel,
    is_published: !!course.publishedAt,
    thumbnail_url: thumbnailUrl || undefined,
    description: description || undefined,
    total_chapters: totalChapters,
    grades: Array.isArray(course.grades) ? course.grades : [],
  };
}

/**
 * Sync course to Xano via POST sync_course. Returns { id: course_id } or null.
 * Does not sync chapters; caller should call syncChapterToXano for each chapter after.
 */
async function syncCourseToXano(course) {
  if (!xano.hasValidBase(xano.getBaseUrl('courses'))) {
    console.warn('[Strapi→Xano] XANO_BASE_URL / XANO_COURSES_BASE_URL not set — skipping course sync');
    return null;
  }

  const payload = buildSyncCoursePayload(course);
  const chapterCount = Array.isArray(course.chapters) ? course.chapters.length : 0;
  console.log('[Strapi→Xano] sync_course start', { title: course.title, id: course.id, chapterCount });

  const result = await xano.post('sync_course', payload, { base: 'courses' });

  if (!result.ok) {
    console.error('[Strapi→Xano] sync_course failed', 'status=', result.status, 'data=', result.data);
    return course.xano_course_id ? { id: course.xano_course_id } : null;
  }

  const courseId = (result.data && (result.data.course_id ?? result.data.id)) || course.xano_course_id;
  if (!courseId) {
    console.error('[Strapi→Xano] sync_course success but no course_id in response', result.data);
    return null;
  }

  console.log('[Strapi→Xano] sync_course success', 'course_id=', courseId);
  return { id: courseId };
}

/**
 * Sync a single chapter to Xano: create (POST) or update (PATCH).
 * Maps: chapter_type → content_type (mixed→text), order → sequence_order, lock_depends_on_order → requires_prev_completion.
 * @param {object} chapter - Strapi chapter
 * @param {number} xanoCourseId - Xano course.id
 * @returns {Promise<{ id: number }|null>}
 */
async function syncChapterToXano(chapter, xanoCourseId) {
  if (!xano.hasValidBase(xano.getBaseUrl('courses'))) {
    console.warn('[Strapi→Xano] XANO_COURSES_BASE_URL not set — skipping chapter sync');
    return null;
  }

  const contentType = (chapter.chapter_type === 'mixed' ? 'text' : chapter.chapter_type) || 'text';
  const textContent = typeof chapter.content === 'string'
    ? chapter.content
    : (chapter.content && chapter.content.data != null ? String(chapter.content.data) : '');
  const payload = {
    course_id: xanoCourseId,
    title: chapter.title || '',
    sequence_order: chapter.order ?? 0,
    content_type: contentType,
    video_url: chapter.video_url || null,
    text_content: textContent || null,
    is_locked: chapter.is_locked ?? true,
    requires_prev_completion: !!chapter.lock_depends_on_order,
    quiz_pass_required: false,
    strapi_document_id: chapter.strapi_document_id || chapter.documentId || String(chapter.id),
  };

  const xanoChapterId = chapter.xano_chapter_id;

  if (xanoChapterId) {
    const result = await xano.patch(`chapter/${xanoChapterId}`, payload, { base: 'courses' });
    if (!result.ok) {
      console.error('[Strapi→Xano] chapter PATCH failed', 'status=', result.status, 'chapter_id=', xanoChapterId);
      return { id: xanoChapterId };
    }
    console.log('[Strapi→Xano] chapter PATCH success', 'chapter_id=', xanoChapterId);
    return { id: (result.data && result.data.id) || xanoChapterId };
  }

  const result = await xano.post('chapter', payload, { base: 'courses' });
  if (!result.ok) {
    console.error('[Strapi→Xano] chapter POST failed', 'status=', result.status, 'data=', result.data);
    return null;
  }
  const newId = (result.data && (result.data.id ?? result.data.chapter_id)) || null;
  console.log('[Strapi→Xano] chapter POST success', 'chapter_id=', newId);
  return newId != null ? { id: newId } : null;
}

module.exports = {
  syncCourseToXano,
  syncChapterToXano,
  buildSyncCoursePayload,
  getFullUrl,
  VISIBILITY_MAP,
};
