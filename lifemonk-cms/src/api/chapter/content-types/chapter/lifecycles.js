'use strict';

const { syncChapterToXano } = require('../../../../services/xano-sync');

async function getXanoCourseIdForChapter(chapter) {
  if (chapter.xano_course_id) return chapter.xano_course_id;
  const strapi = global.strapi || (typeof strapi !== 'undefined' ? strapi : null);
  if (!strapi || !chapter.course) return null;
  try {
    const courseId = typeof chapter.course === 'object' ? (chapter.course.id ?? chapter.course.documentId) : chapter.course;
    if (!courseId) return null;
    let course;
    if (strapi.documents) {
      course = await strapi.documents('api::course.course').findOne({
        documentId: courseId,
        fields: ['xano_course_id'],
      });
    } else {
      course = await strapi.entityService.findOne('api::course.course', courseId, { fields: ['xano_course_id'] });
    }
    return course && course.xano_course_id ? course.xano_course_id : null;
  } catch (e) {
    console.error('[lifecycle] getXanoCourseIdForChapter error:', e.message);
    return null;
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

module.exports = {
  async afterCreate(event) {
    const { result } = event;
    if (!result || result.publishedAt == null) return;
    const xanoCourseId = await getXanoCourseIdForChapter(result);
    if (!xanoCourseId) {
      console.warn('[lifecycle] Chapter has no xano_course_id (sync course first) — skipping chapter sync');
      return;
    }
    try {
      const xanoRecord = await syncChapterToXano(result, xanoCourseId);
      if (!xanoRecord?.id) return;
      const docId = result.documentId ?? result.id;
      await updateChapterDoc(docId, {
        xano_chapter_id: xanoRecord.id,
        xano_course_id: xanoCourseId,
        strapi_document_id: result.strapi_document_id || result.documentId || String(result.id),
      });
    } catch (err) {
      console.error('[lifecycle] Chapter afterCreate sync error:', err.message);
    }
  },

  async afterUpdate(event) {
    const { result } = event;
    if (!result || result.publishedAt == null) return;
    const xanoCourseId = await getXanoCourseIdForChapter(result);
    if (!xanoCourseId) {
      console.warn('[lifecycle] Chapter has no xano_course_id — skipping chapter sync');
      return;
    }
    try {
      const xanoRecord = await syncChapterToXano(result, xanoCourseId);
      if (!xanoRecord?.id) return;
      const docId = result.documentId ?? result.id;
      await updateChapterDoc(docId, {
        xano_chapter_id: xanoRecord.id,
        xano_course_id: xanoCourseId,
        strapi_document_id: result.strapi_document_id || result.documentId || String(result.id),
      });
    } catch (err) {
      console.error('[lifecycle] Chapter afterUpdate sync error:', err.message);
    }
  },
};
