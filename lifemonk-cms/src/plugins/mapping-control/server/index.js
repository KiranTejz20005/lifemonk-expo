'use strict';

/**
 * mapping-control plugin server entry (Strapi 5 expects server/index.js).
 * Registers /assign and Xano proxy routes: /xano/schools, /xano/grades, /xano/user-count, /xano/user-courses.
 */
const path = require('path');

let strapiInstance;

function getXanoClient() {
  const clientPath = path.join(process.cwd(), 'src', 'services', 'xano-client.js');
  return require(clientPath);
}

function toArray(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  const arr = data.data ?? data.items ?? data.results ?? data.records ?? data.grades ?? data.schools ?? data.body ?? [];
  return Array.isArray(arr) ? arr : [];
}

const routeList = [
  { method: 'POST', path: '/assign', handler: 'mappingController.assign', config: { auth: false, policies: [] } },
  { method: 'GET', path: '/xano/schools', handler: 'xanoController.schools', config: { auth: false, policies: [] } },
  { method: 'GET', path: '/xano/grades', handler: 'xanoController.grades', config: { auth: false, policies: [] } },
  { method: 'GET', path: '/xano/categories', handler: 'xanoController.categories', config: { auth: false, policies: [] } },
  { method: 'GET', path: '/xano/courses', handler: 'xanoController.courses', config: { auth: false, policies: [] } },
  { method: 'GET', path: '/xano/catalog', handler: 'xanoController.catalog', config: { auth: false, policies: [] } },
  { method: 'GET', path: '/xano/user-count', handler: 'xanoController.userCount', config: { auth: false, policies: [] } },
  { method: 'GET', path: '/xano/user-courses', handler: 'xanoController.userCourses', config: { auth: false, policies: [] } },
];

// Strapi 5: export routes as object so we can use type 'content-api' and prefix for /api/mapping-control/...
const routes = {
  contentAPI: {
    type: 'content-api',
    prefix: '/mapping-control',
    routes: routeList,
  },
};

const controllers = {
  mappingController: {
    async assign(ctx) {
      const { audience, assets, rules } = ctx.request.body || {};
      let userType = audience?.userType || audience?.subscription_type || 'premium';
      if (userType === 'school' || userType === 'all') userType = 'premium';
      if (!['basic', 'premium', 'ultra'].includes(userType)) userType = 'premium';
      const grade = audience?.grade ?? null;
      const schools = audience?.schools ?? audience?.school_name ?? null;
      const schoolId = Array.isArray(schools) && schools.length > 0 ? schools[0] : (typeof schools === 'string' && schools ? schools.split(',')[0].trim() : null);
      const gradeIds = Array.isArray(audience?.gradeIds) ? audience.gradeIds : (grade != null ? [Number(grade)] : []);

      const results = [];
      const xano = getXanoClient();
      const coursesBaseUrl = xano.getBaseUrl('courses');
      const canCallXano = xano.hasValidBase(coursesBaseUrl);

      for (const asset of assets || []) {
        const assetType = asset.type || 'course';
        const assetId = asset.id != null ? asset.id : 0;
        const assetName = asset.name || '';

        const mappingData = {
          asset_type: assetType,
          asset_id: Number(assetId) || 0,
          asset_name: assetName,
          subscription_type: userType,
          grade: grade != null ? Number(grade) : null,
          school_name: typeof schools === 'string' ? schools : (Array.isArray(schools) ? schools.join(',') : null),
          is_active: true,
        };

        const entry = await strapiInstance.entityService.create('api::mapping.mapping', {
          data: mappingData,
        });
        results.push(entry);

        if (canCallXano && assetType === 'course' && (assetId || assetName)) {
          const contentId = String(assetId || assetName);
          const numericCourseId = typeof assetId === 'number' && Number.isFinite(assetId) ? assetId : (parseInt(String(assetId), 10) || null);
          const payload = {
            content_type: 'course',
            content_id: contentId,
            content_title: assetName,
            grade_ids: gradeIds,
            subscription_type: userType,
            school_id: schoolId ? parseInt(String(schoolId), 10) || 0 : 0,
            is_active: true,
            assigned_by: 1,
          };
          if (numericCourseId != null) payload.course_id = numericCourseId;
          const res = await xano.post('upsert_entitlement', payload, { base: 'courses' });
          if (!res.ok) {
            console.warn('[mapping-control] Xano upsert_entitlement failed:', res.status, contentId, '- Check XANO_COURSES_BASE_URL and that POST upsert_entitlement exists in that API group.');
          } else {
            console.log('[mapping-control] Xano entitlement saved 200 for', contentId);
          }
        }
      }

      ctx.send({ ok: true, created: results.length, results });
    },
  },
  xanoController: {
    async schools(ctx) {
      const xano = getXanoClient();
      if (!xano.hasValidBase(xano.getBaseUrl('members'))) {
        console.warn('[mapping-control] XANO_MEMBERS_BASE_URL / XANO_BASE_URL not set — cannot fetch schools');
        ctx.send([]);
        return;
      }
      const data = await xano.get('get_all_schools', { base: 'members' });
      ctx.send(toArray(data));
    },
    async grades(ctx) {
      const xano = getXanoClient();
      if (!xano.hasValidBase(xano.getBaseUrl('members'))) {
        console.warn('[mapping-control] XANO_BASE_URL / XANO_MEMBERS_BASE_URL not set — cannot fetch grades');
        ctx.send([]);
        return;
      }
      let data = await xano.get('get_all_grades', { base: 'members' });
      let list = toArray(data);
      if (list.length === 0) {
        data = await xano.get('grade', { base: 'members' });
        list = toArray(data);
      }
      if (list.length === 0) {
        data = await xano.get('grades', { base: 'members' });
        list = toArray(data);
      }
      ctx.send(list);
    },
    async userCount(ctx) {
      const xano = getXanoClient();
      if (!xano.hasValidBase(xano.getBaseUrl('members'))) {
        console.warn('[mapping-control] XANO_BASE_URL (or XANO_MEMBERS_BASE_URL) not set — cannot fetch user count');
        ctx.send({ count: 0 });
        return;
      }
      const userGroup = ctx.query?.userGroup || '';
      const gradesParam = ctx.query?.grades || '';
      const schoolsParam = ctx.query?.schools || '';
      const grades = gradesParam ? String(gradesParam).split(',').map((s) => s.trim()).filter(Boolean) : [];
      const schools = schoolsParam ? String(schoolsParam).split(',').map((s) => s.trim()).filter(Boolean) : [];

      const data = await xano.get('get_all_users', { base: 'members' });
      let users = toArray(data);
      if (!Array.isArray(users) && data && typeof data === 'object') {
        const firstArray = Object.values(data).find((v) => Array.isArray(v));
        users = firstArray ? firstArray : [];
      }
      if (users.length === 0 && data && typeof data === 'object' && !Array.isArray(data)) {
        console.warn('[mapping-control] get_all_users returned 0 users; response keys:', Object.keys(data).join(', '));
      }

      const subType = (u) => (u.subscription_type ?? u.user_type ?? '').toString().toLowerCase();
      const userGrade = (u) => {
        const g = u.grade;
        if (g === null || g === undefined) return null;
        if (typeof g === 'object' && g !== null && 'id' in g) return Number(g.id) || null;
        return typeof g === 'number' ? g : parseInt(String(g), 10);
      };
      const userSchool = (u) => {
        const s = u.school_id ?? u.school_name ?? u.school ?? '';
        if (typeof s === 'object' && s !== null && (s.id != null || s.name != null)) return String(s.id ?? s.name ?? '');
        return String(s).trim();
      };

      let filtered = users;
      if (userGroup === 'premium') filtered = filtered.filter((u) => subType(u) === 'premium');
      else if (userGroup === 'ultra') filtered = filtered.filter((u) => subType(u) === 'ultra');
      else if (userGroup === 'school' && schools.length > 0) {
        filtered = filtered.filter((u) => {
          const s = userSchool(u);
          const id = (u.school_id ?? u.school ?? '').toString();
          return schools.some((sc) => sc === s || sc === id);
        });
      }

      if (grades.length > 0) {
        const gradeSet = new Set(grades.map((g) => Number(g) || g));
        filtered = filtered.filter((u) => {
          const g = userGrade(u);
          return g !== null && gradeSet.has(g);
        });
      }

      ctx.send({ count: filtered.length });
    },
    async userCourses(ctx) {
      const xano = getXanoClient();
      const query = ctx.query || {};
      const qs = Object.keys(query).length ? `?${new URLSearchParams(query).toString()}` : '';
      const data = await xano.get(`get_user_courses${qs}`, { base: 'courses' });
      ctx.send(data != null ? data : {});
    },
    async categories(ctx) {
      const xano = getXanoClient();
      if (!xano.hasValidBase(xano.getBaseUrl('courses'))) {
        ctx.send([]);
        return;
      }
      const coursesData = await xano.get('get_all_courses', { base: 'courses' })
        || await xano.get('course', { base: 'courses' })
        || await xano.get('courses', { base: 'courses' });
      const courses = toArray(coursesData);
      const seen = new Set();
      const list = [];
      const categoryName = (c) => (c && (c.category ?? c.attributes?.category));
      courses.forEach((c) => {
        const name = categoryName(c);
        if (name != null && String(name).trim() && !seen.has(String(name).trim())) {
          seen.add(String(name).trim());
          list.push({ id: String(name).trim(), name: String(name).trim() });
        }
      });
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      ctx.send(list);
    },
    async courses(ctx) {
      const xano = getXanoClient();
      if (!xano.hasValidBase(xano.getBaseUrl('courses'))) {
        ctx.send([]);
        return;
      }
      const data = await xano.get('get_all_courses', { base: 'courses' })
        || await xano.get('course', { base: 'courses' })
        || await xano.get('courses', { base: 'courses' });
      ctx.send(toArray(data));
    },
    async catalog(ctx) {
      const xano = getXanoClient();
      if (!xano.hasValidBase(xano.getBaseUrl('courses'))) {
        ctx.send({ categories: [], courses: [] });
        return;
      }
      const data = await xano.get('get_all_courses', { base: 'courses' })
        || await xano.get('course', { base: 'courses' })
        || await xano.get('courses', { base: 'courses' });
      const courses = toArray(data);
      const seen = new Set();
      const categories = [];
      const categoryName = (c) => (c && (c.category ?? c.attributes?.category));
      courses.forEach((c) => {
        const name = categoryName(c);
        if (name != null && String(name).trim() && !seen.has(String(name).trim())) {
          seen.add(String(name).trim());
          categories.push({ id: String(name).trim(), name: String(name).trim() });
        }
      });
      categories.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      ctx.send({ categories, courses });
    },
  },
};

module.exports = () => ({
  register({ strapi }) {
    strapiInstance = strapi;
  },
  bootstrap() {},
  destroy() {},
  config: {},
  routes,
  controllers,
  services: {},
  policies: {},
  middlewares: {},
  contentTypes: {},
});
