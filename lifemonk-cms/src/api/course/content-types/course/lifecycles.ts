import { Core } from '@strapi/strapi';

export default {
  async afterCreate(event: any) {
    const populated = await (strapi as any).entityService.findOne(
      'api::course.course',
      event.result.id,
      { populate: ['category'] }
    );
    await syncCourseToXano(populated);
  },
  async afterUpdate(event: any) {
    const populated = await (strapi as any).entityService.findOne(
      'api::course.course',
      event.result.id,
      { populate: ['category'] }
    );
    await syncCourseToXano(populated);
  },
};

async function syncCourseToXano(course: any) {
  try {
    const XANO_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:j1bkW6GC';

    const visibilityMap: any = {
      'all': 'public',
      'premium': 'restricted',
      'ultra': 'hidden',
    };

    const payload = {
      strapi_document_id: course.documentId || String(course.id),
      title: course.title || '',
      category: course.category?.name || 'general',
      visibility_level: visibilityMap[course.user_type_visibility] || 'public',
      grades: Array.isArray(course.grades) ? course.grades : [],
      is_published: !!course.publishedAt,
    };

    console.log('[Strapi→Xano] Syncing:', payload);

    const res = await fetch(XANO_URL + '/sync_course', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    console.log('[Strapi→Xano] Done:', result);
  } catch (err) {
    console.error('[Strapi→Xano] Failed:', err);
  }
}
