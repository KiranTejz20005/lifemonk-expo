import type { Core } from '@strapi/strapi';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const publicRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (!publicRole) return;

    const contentTypes = [
      'api::course.course',
      'api::chapter.chapter',
      'api::quiz.quiz',
      'api::category.category',
    ];

    const actions = ['find', 'findOne'];

    for (const contentType of contentTypes) {
      for (const action of actions) {
        const exists = await strapi.db
          .query('plugin::users-permissions.permission')
          .findOne({
            where: {
              role: publicRole.id,
              action: `${contentType}.${action}`,
            },
          });

        if (!exists) {
          await strapi.db
            .query('plugin::users-permissions.permission')
            .create({
              data: {
                action: `${contentType}.${action}`,
                role: publicRole.id,
                enabled: true,
              },
            });
        }
      }
    }
  },
};
