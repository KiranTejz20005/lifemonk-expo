'use strict';

const { syncChapterToXano } = require('../../../../services/xano-sync');

module.exports = {
  async afterCreate(event) {
    const { result } = event;
    if (!result || result.publishedAt == null) return;
    const xanoCourseId = result.xano_course_id;
    if (!xanoCourseId) {
      console.warn('[lifecycle] Chapter has no xano_course_id — skipping sync');
      return;
    }
    try {
      const xanoRecord = await syncChapterToXano(result, xanoCourseId);
      if (!xanoRecord?.id) return;
      const docId = result.documentId ?? result.id;
      if (typeof strapi !== 'undefined' && strapi.documents) {
        await strapi.documents('api::chapter.chapter').update({
          documentId: docId,
          data: { xano_chapter_id: xanoRecord.id },
        });
      } else {
        await strapi.entityService.update('api::chapter.chapter', docId, {
          data: { xano_chapter_id: xanoRecord.id },
        });
      }
    } catch (err) {
      console.error('[lifecycle] Chapter afterCreate sync error:', err.message);
    }
  },

  async afterUpdate(event) {
    const { result } = event;
    if (!result || result.publishedAt == null) return;
    const xanoCourseId = result.xano_course_id;
    if (!xanoCourseId || result.xano_chapter_id) return;
    try {
      const xanoRecord = await syncChapterToXano(result, xanoCourseId);
      if (!xanoRecord?.id) return;
      const docId = result.documentId ?? result.id;
      if (typeof strapi !== 'undefined' && strapi.documents) {
        await strapi.documents('api::chapter.chapter').update({
          documentId: docId,
          data: { xano_chapter_id: xanoRecord.id },
        });
      } else {
        await strapi.entityService.update('api::chapter.chapter', docId, {
          data: { xano_chapter_id: xanoRecord.id },
        });
      }
    } catch (err) {
      console.error('[lifecycle] Chapter afterUpdate sync error:', err.message);
    }
  },
};
