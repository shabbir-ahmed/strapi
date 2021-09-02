/* eslint-disable no-unreachable */
'use strict';

const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const defaultConfig = require('./config/default-config');
const { buildGetResponses } = require('./utils/builders');

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

const createDocumentationDirectory = async apiDirPath => {
  try {
    await fs.ensureDir(apiDirPath);
  } catch (error) {
    console.error(error);
  }
};

const parsePathWithVariables = routePath => {
  const pathsArray = routePath.split('/');
  const [, rootPath] = pathsArray;
  const parsedVariables = pathsArray
    .filter(path => path.includes(':'))
    .map(path => {
      return `{${path.split(':').pop()}}`;
    });

  return `/${rootPath}/${parsedVariables.join('/')}`;
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

        _.set(acc.paths, `${routePath}.get`, buildGetResponses(attributes, route));
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
      'api',
      apiName,
      'documentation',
      apiVersion
    );
    const apiDocPath = path.join(apiDirPath, `${apiName}.json`);
    await createDocumentationDirectory(apiName, apiDirPath);
    const apiPathsObject = buildApiEndpointJSONPath(apiName);

    await fs.writeJson(apiDocPath, apiPathsObject, { spaces: 2 });
    paths = { ...paths, ...apiPathsObject.paths };
  }

  const fullDocJsonPath = path.join(fullDocPath, apiVersion, 'full_documentation.json');
  await createFullDoc(fullDocJsonPath, paths);
};
