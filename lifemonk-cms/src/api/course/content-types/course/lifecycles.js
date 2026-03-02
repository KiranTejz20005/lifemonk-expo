'use strict';

const { syncCourseToXano, syncChapterToXano } = require('../../../../services/xano-sync');

const DEBOUNCE_MS = 3000;
const lastSyncByCourseId = new Map();

function shouldDebounce(courseId) {
  const now = Date.now();
  const last = lastSyncByCourseId.get(courseId);
  if (last != null && now - last < DEBOUNCE_MS) return true;
  lastSyncByCourseId.set(courseId, now);
  return false;
}

async function getPopulatedCourse(idOrDocumentId) {
  const strapi = global.strapi || (typeof strapi !== 'undefined' ? strapi : null);
  if (!strapi) return null;
  try {
    if (strapi.documents) {
      return await strapi.documents('api::course.course').findOne({
        documentId: idOrDocumentId,
        populate: ['category', 'chapters'],
      });
    }
    return await strapi.entityService.findOne('api::course.course', idOrDocumentId, {
      populate: ['category', 'chapters'],
    });
  } catch (e) {
    console.error('[lifecycle] getPopulatedCourse error:', e.message);
    return null;
  }
}

async function updateCourseDoc(docId, data) {
  const strapi = global.strapi || (typeof strapi !== 'undefined' ? strapi : null);
  if (!strapi) return;
  try {
    if (strapi.documents) {
      await strapi.documents('api::course.course').update({ documentId: docId, data });
    } else {
      await strapi.entityService.update('api::course.course', docId, { data });
    }
  } catch (e) {
    console.error('[lifecycle] updateCourseDoc error:', e.message);
  }
}

async function updateChapterDoc(docId, data) {
  const strapi = global.strapi || (typeof strapi !== 'undefined' ? strapi : null);
  if (!strapi) return;
  try {
    if (strapi.documents) {
      await strapi.documents('api::chapter.chapter').update({ documentId: docId, data });
    } else {
      await strapi.entityService.update('api::chapter.chapter', docId, { data });
    }
  } catch (e) {
    console.error('[lifecycle] updateChapterDoc error:', e.message);
  }
}

async function syncCourseAndChapters(result) {
  const docId = result.documentId ?? result.id;
  const courseId = result.id;
  if (shouldDebounce(courseId)) {
    console.log('[Strapi→Xano] course sync debounced', courseId);
    return;
  }
  const populated = await getPopulatedCourse(docId);
  if (!populated) return;
  const xanoRecord = await syncCourseToXano(populated);
  if (!xanoRecord?.id) return;
  const xanoCourseId = xanoRecord.id;
  const strapiDocumentId = populated.strapi_document_id || populated.documentId || String(populated.id);
  await updateCourseDoc(docId, {
    xano_course_id: xanoCourseId,
    strapi_document_id: strapiDocumentId,
  });
  const chapters = Array.isArray(populated.chapters) ? populated.chapters : [];
  for (const ch of chapters) {
    const chDocId = ch.documentId ?? ch.id;
    const chXano = await syncChapterToXano(ch, xanoCourseId);
    if (chXano?.id) {
      await updateChapterDoc(chDocId, {
        xano_chapter_id: chXano.id,
        xano_course_id: xanoCourseId,
        strapi_document_id: ch.strapi_document_id || ch.documentId || String(ch.id),
      });
    }
  }
}

module.exports = {
  async afterCreate(event) {
    const { result } = event;
    if (!result || result.publishedAt == null) return;
    try {
      await syncCourseAndChapters(result);
    } catch (err) {
      console.error('[lifecycle] Course afterCreate sync error:', err.message);
    }
  },

  async afterUpdate(event) {
    const { result } = event;
    if (!result || result.publishedAt == null) return;
    try {
      await syncCourseAndChapters(result);
    } catch (err) {
      console.error('[lifecycle] Course afterUpdate sync error:', err.message);
    }
  },

  async afterDelete(event) {
    const { result } = event;
    if (result && result.id) lastSyncByCourseId.delete(result.id);
  },
};
