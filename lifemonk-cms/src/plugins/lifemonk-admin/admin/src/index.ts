import { PLUGIN_ID } from './pluginId';
import LinkIcon from './components/LinkIcon';
import ContentDrillDownPage from './pages/ContentDrillDownPage';
import MappingPage from './pages/MappingPage';

export default {
  register(app: any) {
    // Mapping — 3-step flow: WHO → WHAT → Save (Strapi Mapping collection)
    app.addMenuLink({
      to: `/plugins/${PLUGIN_ID}/mapping`,
      icon: LinkIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.mapping`,
        defaultMessage: 'Mapping',
      },
      Component: () => Promise.resolve({ default: MappingPage }),
      permissions: [],
    });

    // Content — drill-down: Category → Courses → Chapters
    app.addMenuLink({
      to: `/plugins/${PLUGIN_ID}/content`,
      icon: () => null,
      intlLabel: {
        id: `${PLUGIN_ID}.content`,
        defaultMessage: 'Content',
      },
      Component: () => Promise.resolve({ default: ContentDrillDownPage }),
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
