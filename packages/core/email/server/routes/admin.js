'use strict';

module.exports = {
  type: 'admin',
  routes: [
    {
      method: 'POST',
      path: '/',
      handler: 'email.send',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    {
      method: 'POST',
      path: '/test',
      handler: 'email.test',
      config: {
        description: 'send and email test',
        tag: {
          plugin: 'email',
          name: 'Email',
        },
        policies: [
          'admin::isAuthenticatedAdmin',
          { name: 'admin::hasPermissions', options: { actions: ['plugin::email.settings.read'] } },
        ],
      },
    },
    {
      method: 'GET',
      path: '/settings',
      handler: 'email.getSettings',
      config: {
        description: 'get email settings',
        tag: {
          plugin: 'email',
          name: 'Email',
        },
        policies: [
          'admin::isAuthenticatedAdmin',
          { name: 'admin::hasPermissions', options: { actions: ['plugin::email.settings.read'] } },
        ],
      },
    },
  ],
};
