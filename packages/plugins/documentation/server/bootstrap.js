/* eslint-disable no-unreachable */
'use strict';

const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const pathToRegexp = require('path-to-regexp');

const defaultConfig = require('./config/default-config');
const { buildApiResponses, buildApiRequests } = require('./utils/builders');

// Add permissions
const RBAC_ACTIONS = [
  {
    section: 'plugins',
    displayName: 'Access the Documentation',
    uid: 'read',
    pluginName: 'documentation',
  },
  {
    section: 'plugins',
    displayName: 'Update and delete',
    uid: 'settings.update',
    subCategory: 'settings',
    pluginName: 'documentation',
  },
  {
    section: 'plugins',
    displayName: 'Regenerate',
    uid: 'settings.regenerate',
    subCategory: 'settings',
    pluginName: 'documentation',
  },
];

const parsePathWithVariables = routePath => {
  const parsedPath = pathToRegexp
    .parse(routePath)
    .map(token => {
      if (_.isObject(token)) {
        return token.prefix + '{' + token.name + '}';
      }

      return token;
    })
    .join('');

  return parsedPath;
};

const buildApiEndpointJSONPath = apiName => {
  const attributes = strapi.contentType(`api::${apiName}.${apiName}`).attributes;
  const routes = strapi.api[apiName].routes[apiName].routes;

  const paths = routes.reduce(
    (acc, route) => {
      if (route.method === 'GET') {
        const routePath = route.path.includes(':')
          ? parsePathWithVariables(route.path)
          : route.path;
        const { responses } = buildApiResponses(attributes, route);
        _.set(acc.paths, `${routePath}.get.responses`, responses);
        _.set(acc.paths, `${routePath}.get.tags`, [_.upperFirst(route.info.apiName)]);
      }

      if (route.method === 'POST') {
        const routePath = route.path.includes(':')
          ? parsePathWithVariables(route.path)
          : route.path;

        const { responses } = buildApiResponses(attributes, route);
        const { requestBody } = buildApiRequests(attributes, route);
        _.set(acc.paths, `${routePath}.post.responses`, responses);
        _.set(acc.paths, `${routePath}.post.requestBody`, requestBody);
        _.set(acc.paths, `${routePath}.post.tags`, [_.upperFirst(route.info.apiName)]);
      }

      if (route.method === 'PUT') {
        const routePath = route.path.includes(':')
          ? parsePathWithVariables(route.path)
          : route.path;

        const { responses } = buildApiResponses(attributes, route);
        const { requestBody } = buildApiRequests(attributes, route);
        _.set(acc.paths, `${routePath}.put.responses`, responses);
        _.set(acc.paths, `${routePath}.put.requestBody`, requestBody);
        _.set(acc.paths, `${routePath}.put.tags`, [_.upperFirst(route.info.apiName)]);
      }

      if (route.method === 'DELETE') {
        const routePath = route.path.includes(':')
          ? parsePathWithVariables(route.path)
          : route.path;
        const { responses } = buildApiResponses(attributes, route);
        _.set(acc.paths, `${routePath}.delete.responses`, responses);
        _.set(acc.paths, `${routePath}.delete.tags`, [_.upperFirst(route.info.apiName)]);
      }

      return acc;
    },
    { paths: {} }
  );

  return paths;
};

const createFullDoc = async (fullDocJsonPath, paths) => {
  await fs.ensureFile(fullDocJsonPath);
  // write to full doc path
  await fs.writeJson(fullDocJsonPath, { ...defaultConfig, paths }, { spaces: 2 });
};

module.exports = async () => {
  await strapi.admin.services.permission.actionProvider.registerMany(RBAC_ACTIONS);

  // Check if the plugin users-permissions is installed because the documentation needs it
  if (Object.keys(strapi.plugins).indexOf('users-permissions') === -1) {
    throw new Error(
      'In order to make the documentation plugin works the users-permissions one is required'
    );
  }

  const pluginStore = strapi.store({
    environment: '',
    type: 'plugin',
    name: 'documentation',
  });

  const restrictedAccess = await pluginStore.get({ key: 'config' });

  if (!restrictedAccess) {
    pluginStore.set({ key: 'config', value: { restrictedAccess: false } });
  }

  const docPlugin = strapi.plugin('documentation');
  const docPluginService = docPlugin.service('documentation');
  const fullDocPath = docPluginService.getFullDocumentationPath();
  const apiVersion = docPluginService.getDocumentationVersion();

  let paths = {};
  const apis = Object.keys(strapi.api);
  for (const apiName of apis) {
    const apiDirPath = path.join(
      strapi.config.appPath,
      'src',
      'api',
      apiName,
      'documentation',
      apiVersion
    );
    const apiDocPath = path.join(apiDirPath, `${apiName}.json`);
    await fs.ensureFile(apiDocPath);
    const apiPathsObject = buildApiEndpointJSONPath(apiName);

    await fs.writeJson(apiDocPath, apiPathsObject, { spaces: 2 });
    paths = { ...paths, ...apiPathsObject.paths };
  }

  const fullDocJsonPath = path.join(fullDocPath, apiVersion, 'full_documentation.json');
  await createFullDoc(fullDocJsonPath, paths);
};
