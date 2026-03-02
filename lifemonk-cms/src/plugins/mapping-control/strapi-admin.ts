/**
 * mapping-control  —  strapi-admin.ts
 *
 * Admin-side entry point.  Registers the plugin in the Strapi admin sidebar
 * and lazy-loads the wizard page.
 */

const PLUGIN_ID = 'mapping-control';

export default {
  register(app: any) {
    app.addMenuLink({
      to: `/plugins/${PLUGIN_ID}`,
      icon: () => null, // icon provided in admin/src/index.tsx
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.name`,
        defaultMessage: 'Mapping Control',
      },
      Component: () =>
        import('./admin/src/pages/MappingPage').then((m) => ({
          default: m.default,
        })),
      permissions: [],
    });

    app.registerPlugin({
      id: PLUGIN_ID,
      name: PLUGIN_ID,
      isReady: true,
    });
  },

  bootstrap() {},
};
