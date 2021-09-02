'use strict';
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const form = require('./utils/forms');

module.exports = () => {
  const docPlugin = strapi.plugin('documentation');

  return {
    getDocumentationVersion() {
      return docPlugin.config('info.version');
    },

    getFullDocumentationPath() {
      return path.join(strapi.config.appPath, 'extensions', 'documentation', 'documentation');
    },

    retrieveDocumentationVersions() {
      return fs
        .readdirSync(this.getFullDocumentationPath())
        .map(version => {
          try {
            const doc = JSON.parse(
              fs.readFileSync(
                path.resolve(this.getFullDocumentationPath(), version, 'full_documentation.json')
              )
            );
            const generatedDate = _.get(doc, ['info', 'x-generation-date'], null);

            return { version, generatedDate, url: '' };
          } catch (err) {
            return null;
          }
        })
        .filter(x => x);
    },

    async retrieveFrontForm() {
      const config = await strapi
        .store({
          environment: '',
          type: 'plugin',
          name: 'documentation',
          key: 'config',
        })
        .get();
      const forms = JSON.parse(JSON.stringify(form));

      _.set(forms, [0, 0, 'value'], config.restrictedAccess);
      _.set(forms, [0, 1, 'value'], config.password || '');

      return forms;
    },
  };
};
