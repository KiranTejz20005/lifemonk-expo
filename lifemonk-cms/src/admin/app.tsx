import MappingPage from './extensions/MappingPage.js';

export default {
  config: {
    locales: ['en'],
  },
  bootstrap(app: any) {
    app.addMenuLink({
      to: '/mapping-control',
      icon: 'link',
      intlLabel: {
        id: 'mapping-control',
        defaultMessage: 'Mapping Control',
      },
      Component: async () => ({ default: MappingPage }),
      permissions: [],
    });
  },
};
