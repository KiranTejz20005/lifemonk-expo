'use strict';

/**
 * Xano sync service: syncs Strapi course/chapter to Xano on publish.
 * - Course: POST or PATCH /course, then POST /course_grade for each grade.
 * - Chapter: POST or PATCH /chapter with mapped fields.
 * Uses XANO_BASE_URL from env. Never throws — logs errors so Strapi doesn't crash.
 */

const XANO_BASE = process.env.XANO_BASE_URL || '';

function getFullUrl(relativePath) {
  if (!relativePath || typeof relativePath !== 'string') return null;
  const trimmed = relativePath.trim();
  if (!trimmed) return null;
  return trimmed.startsWith('http') ? trimmed : `${process.env.STRAPI_URL || 'http://localhost:1337'}${trimmed}`;
}

/**
 * Sync course to Xano: create or update, then link grades via course_grade.
 * Returns { id } from Xano. On update uses PATCH when xano_course_id exists.
 */
async function syncCourseToXano(course) {
  if (!XANO_BASE) {
    console.warn('[xano-sync] XANO_BASE_URL not set — skipping course sync');
    return null;
  }

  const payload = {
    title: course.title || '',
    category: course.category?.name || course.category?.id ?? '',
    visibility_level: course.user_type_visibility || 'all',
    description: typeof course.description === 'string' ? course.description : (course.description?.data ?? ''),
    thumbnail_url: course.cover_image?.url ? getFullUrl(course.cover_image.url) : null,
    total_chapters: 0,
  };

  let xanoId = course.xano_course_id;

  try {
    if (xanoId) {
      const res = await fetch(`${XANO_BASE}/course/${xanoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(`[xano-sync] Course PATCH failed ${res.status}:`, text);
        return { id: xanoId };
      }
      const data = await res.json().catch(() => ({}));
      xanoId = data.id ?? xanoId;
    } else {
      const res = await fetch(`${XANO_BASE}/course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(`[xano-sync] Course POST failed ${res.status}:`, text);
        return null;
      }
      const data = await res.json().catch(() => ({}));
      xanoId = data.id ?? null;
    }

    if (!xanoId) return null;

    const grades = Array.isArray(course.grades) ? course.grades : [];
    for (const gradeNumber of grades) {
      try {
        const cgRes = await fetch(`${XANO_BASE}/course_grade`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            course_id: xanoId,
            grade_id: typeof gradeNumber === 'number' ? gradeNumber : parseInt(gradeNumber, 10),
          }),
        });
        if (cgRes.ok) {
          // created
        } else if (cgRes.status === 400 || cgRes.status === 409) {
          console.log(`[xano-sync] course_grade duplicate or invalid for grade ${gradeNumber} — skip`);
        } else {
          console.warn(`[xano-sync] course_grade POST ${cgRes.status} for grade ${gradeNumber}`);
        }
      } catch (e) {
        console.warn('[xano-sync] course_grade request failed:', e.message);
      }
    }

    return { id: xanoId };
  } catch (e) {
    console.error('[xano-sync] Course sync error:', e.message);
    return xanoId ? { id: xanoId } : null;
  }
}

/**
 * Sync chapter to Xano: create or update.
 * Maps: chapter_type → content_type, order → sequence_order, lock_depends_on_order → requires_prev_completion.
 * On update uses PATCH when xano_chapter_id exists.
 */
async function syncChapterToXano(chapter, xanoCourseId) {
  if (!XANO_BASE) {
    console.warn('[xano-sync] XANO_BASE_URL not set — skipping chapter sync');
    return null;
  }

  const contentType = (chapter.chapter_type === 'mixed' ? 'text' : chapter.chapter_type) || 'text';

  const payload = {
    course_id: xanoCourseId,
    title: chapter.title || '',
    sequence_order: chapter.order ?? 0,
    content_type: contentType,
    video_url: chapter.video_url || null,
    text_content: typeof chapter.content === 'string' ? chapter.content : (chapter.content?.data ?? ''),
    is_locked: chapter.is_locked ?? true,
    requires_prev_completion: !!chapter.lock_depends_on_order,
    quiz_pass_required: false,
  };

  const xanoId = chapter.xano_chapter_id;

  try {
    if (xanoId) {
      const res = await fetch(`${XANO_BASE}/chapter/${xanoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(`[xano-sync] Chapter PATCH failed ${res.status}:`, text);
        return { id: xanoId };
      }
      const data = await res.json().catch(() => ({}));
      return { id: data.id ?? xanoId };
    }

    const res = await fetch(`${XANO_BASE}/chapter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[xano-sync] Chapter POST failed ${res.status}:`, text);
      return null;
    }
    const data = await res.json().catch(() => ({}));
    return { id: data.id ?? null };
  } catch (e) {
    console.error('[xano-sync] Chapter sync error:', e.message);
    return xanoId ? { id: xanoId } : null;
  }
}

module.exports = { syncCourseToXano, syncChapterToXano };
