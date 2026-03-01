console.log('[Lifecycles] Course lifecycle file loaded!');

export default {
  async afterCreate(event: any) {
    await syncCourseToXano(event.result);
  },
  async afterUpdate(event: any) {
    await syncCourseToXano(event.result);
  },
};

async function syncCourseToXano(course: any) {
  try {
    const XANO_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:j1bkW6GC';

    const visibilityMap: any = {
      'all': 'public',
      'premium_ultra': 'restricted',
      'ultra_only': 'hidden',
    };
    const visibility = visibilityMap[course.user_type_visibility] || 'public';

    const payload = {
      strapi_document_id: course.documentId || String(course.id),
      title: course.title || '',
      category: course.category?.name || 'foundation',
      visibility_level: visibility,
      grades: Array.isArray(course.grades) ? course.grades : [],
      is_published: !!course.publishedAt,
    };

    console.log('[Strapi→Xano] Syncing course:', payload);

    const res = await fetch(XANO_URL + '/sync_course', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    console.log('[Strapi→Xano] Sync result:', result);
  } catch (err) {
    console.error('[Strapi→Xano] Sync failed:', err);
  }
}
