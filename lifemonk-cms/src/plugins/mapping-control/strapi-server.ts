/**
 * mapping-control  —  strapi-server.ts
 *
 * Server-side entry: exposes a lightweight /api/mapping-control/assign endpoint
 * that receives the final payload from the admin wizard and fans it out to
 * the Strapi Mapping collection-type (or any external service).
 */

export default {
  register({ strapi }: { strapi: any }) {
    // nothing extra to register on the server side for now
  },

  bootstrap({ strapi }: { strapi: any }) {
    // future: seed default mapping rules, register lifecycles, etc.
  },

  routes: [
    {
      method: 'POST',
      path: '/assign',
      handler: 'mappingController.assign',
      config: { policies: [] },
    },
  ],

  controllers: {
    mappingController: {
      async assign(ctx: any) {
        const { audience, assets, rules } = ctx.request.body;

        // Fan out: create one mapping entry per asset
        const results: any[] = [];
        for (const asset of assets) {
          const entry = await strapi.entityService.create('api::mapping.mapping', {
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
  },
};
