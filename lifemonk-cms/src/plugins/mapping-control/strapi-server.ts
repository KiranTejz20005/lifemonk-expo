/**
 * mapping-control  —  strapi-server.ts
 *
 * Server-side: /assign endpoint + Xano proxy routes so admin can fetch
 * schools, grades, users, user-courses from Xano. Uses xano-client for all Xano calls.
 */
/// <reference types="node" />

let strapiInstance: any;

// Lazy-load xano-client (CommonJS). Relative to plugin when Strapi runs from src.
function getXanoClient(): any {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../../../services/xano-client');
}

function toArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  const arr = data?.data ?? data?.items ?? data?.results ?? data?.records ?? [];
  return Array.isArray(arr) ? arr : [];
}

const routes = [
  { method: 'POST', path: '/assign', handler: 'mappingController.assign', config: { policies: [] } },
  { method: 'GET', path: '/xano/schools', handler: 'xanoController.schools', config: { policies: [] } },
  { method: 'GET', path: '/xano/grades', handler: 'xanoController.grades', config: { policies: [] } },
  { method: 'GET', path: '/xano/user-count', handler: 'xanoController.userCount', config: { policies: [] } },
  { method: 'GET', path: '/xano/user-courses', handler: 'xanoController.userCourses', config: { policies: [] } },
];

const controllers = {

    mappingController: {
      async assign(ctx: any) {
        const { audience, assets, rules } = ctx.request.body;
        const results: any[] = [];
        for (const asset of assets) {
          const entry = await strapiInstance.entityService.create('api::mapping.mapping', {
            data: {
              audienceType: audience.userType,
              grade: audience.grade ?? null,
              specificUsers: audience.specificUsers ?? [],
              assetType: asset.type,
              assetId: asset.id,
              assetName: asset.name,
              accessType: rules.accessType,
              expiryDate: rules.expiryDate ?? null,
              assignmentMode: rules.assignmentMode,
            },
          });
          results.push(entry);
        }
        ctx.send({ ok: true, created: results.length, results });
      },
    },
    xanoController: {
      async schools(ctx: any) {
        const xano = getXanoClient();
        const data = await xano.get('get_all_schools', { base: 'members' });
        ctx.send(toArray(data));
      },
      async grades(ctx: any) {
        const xano = getXanoClient();
        let data = await xano.get('get_all_grades', { base: 'members' });
        let list = toArray(data);
        if (list.length === 0) {
          data = await xano.get('grade', { base: 'members' });
          list = toArray(data);
        }
        ctx.send(list);
      },
      async userCount(ctx: any) {
        const xano = getXanoClient();
        if (!xano.hasValidBase(xano.getBaseUrl('members'))) {
          console.warn('[mapping-control] XANO_BASE_URL (or XANO_MEMBERS_BASE_URL) not set — cannot fetch user count');
          ctx.send({ count: 0 });
          return;
        }
        const userGroup = ctx.query?.userGroup || '';
        const gradesParam = ctx.query?.grades || '';
        const schoolsParam = ctx.query?.schools || '';
        const grades = gradesParam ? String(gradesParam).split(',').map((s: string) => s.trim()).filter(Boolean) : [];
        const schools = schoolsParam ? String(schoolsParam).split(',').map((s: string) => s.trim()).filter(Boolean) : [];

        const data = await xano.get('get_all_users', { base: 'members' });
        let users: any[] = toArray(data);
        if (!Array.isArray(users) && data && typeof data === 'object') {
          const firstArray = Object.values(data).find((v) => Array.isArray(v));
          users = firstArray ? (firstArray as any[]) : [];
        }
        if (users.length === 0 && data && typeof data === 'object' && !Array.isArray(data)) {
          console.warn('[mapping-control] get_all_users returned 0 users; response keys:', Object.keys(data).join(', '));
        }

        const subType = (u: any) => (u.subscription_type ?? u.user_type ?? '').toString().toLowerCase();
        const userGrade = (u: any) => {
          const g = u.grade;
          if (g === null || g === undefined) return null;
          if (typeof g === 'object' && g !== null && 'id' in g) return Number((g as any).id) || null;
          return typeof g === 'number' ? g : parseInt(String(g), 10);
        };
        const userSchool = (u: any) => {
          const s = u.school_id ?? u.school_name ?? u.school ?? '';
          if (typeof s === 'object' && s !== null && (s.id != null || s.name != null)) return String((s as any).id ?? (s as any).name ?? '');
          return String(s).trim();
        };

        let filtered = users;
        if (userGroup === 'premium') filtered = filtered.filter((u: any) => subType(u) === 'premium');
        else if (userGroup === 'ultra') filtered = filtered.filter((u: any) => subType(u) === 'ultra');
        else if (userGroup === 'school' && schools.length > 0) {
          filtered = filtered.filter((u: any) => {
            const s = userSchool(u);
            const id = (u.school_id ?? u.school ?? '').toString();
            return schools.some((sc: string) => sc === s || sc === id);
          });
        }

        if (grades.length > 0) {
          const gradeSet = new Set(grades.map((g: string) => (Number(g) || g) as number));
          filtered = filtered.filter((u: any) => {
            const g = userGrade(u);
            return g !== null && gradeSet.has(g);
          });
        }

        ctx.send({ count: filtered.length });
      },
      async userCourses(ctx: any) {
        const xano = getXanoClient();
        const query = ctx.query || {};
        const qs = Object.keys(query).length ? `?${new URLSearchParams(query as any).toString()}` : '';
        const data = await xano.get(`get_user_courses${qs}`, { base: 'courses' });
        ctx.send(data != null ? data : {});
      },
    },
  },
};

export default () => ({
  register({ strapi }: { strapi: any }) {
    strapiInstance = strapi;
  },
  bootstrap() {},
  routes,
  controllers,
  type: 'content-api',
});
