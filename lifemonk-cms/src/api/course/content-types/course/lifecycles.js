'use strict';

const { syncCourseToXano } = require('../../../../services/xano-sync');

module.exports = {
  async afterCreate(event) {
    const { result } = event;
    if (!result || result.publishedAt == null) return;
    try {
      const xanoRecord = await syncCourseToXano(result);
      if (!xanoRecord?.id) return;
      const docId = result.documentId ?? result.id;
      if (typeof strapi !== 'undefined' && strapi.documents) {
        await strapi.documents('api::course.course').update({
          documentId: docId,
          data: { xano_course_id: xanoRecord.id },
        });
      } else {
        await strapi.entityService.update('api::course.course', docId, {
          data: { xano_course_id: xanoRecord.id },
        });
      }
    } catch (err) {
      console.error('[lifecycle] Course afterCreate sync error:', err.message);
    }
  },

  async afterUpdate(event) {
    const { result } = event;
    if (!result || result.publishedAt == null) return;
    if (result.xano_course_id) return;
    try {
      const xanoRecord = await syncCourseToXano(result);
      if (!xanoRecord?.id) return;
      const docId = result.documentId ?? result.id;
      if (typeof strapi !== 'undefined' && strapi.documents) {
        await strapi.documents('api::course.course').update({
          documentId: docId,
          data: { xano_course_id: xanoRecord.id },
        });
      } else {
        await strapi.entityService.update('api::course.course', docId, {
          data: { xano_course_id: xanoRecord.id },
        });
      }
    } catch (err) {
      console.error('[lifecycle] Course afterUpdate sync error:', err.message);
    }
  },
};
