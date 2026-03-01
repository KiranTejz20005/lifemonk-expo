import { PLUGIN_ID } from './admin/src/pluginId';

export default {
  register(app: any) {
    app.addMenuLink({
      to: `/plugins/${PLUGIN_ID}`,
      icon: () => null,
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.name`,
        defaultMessage: 'LifeMonk CMS',
      },
      Component: async () => {
        const { App } = await import('./admin/src/pages/App');
        return { default: App };
      },
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
