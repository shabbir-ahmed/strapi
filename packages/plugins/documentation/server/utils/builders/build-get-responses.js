'use strict';

const _ = require('lodash');

module.exports = (attributes, route) => {
  // FIXME: this isn't reliable since a handler doesn't have to be called findOne
  let data;
  let meta;
  if (route.handler.includes('findOne')) {
    data = {
      type: 'object',
      properties: { attributes: { properties: attributes } },
    };
    meta = { type: 'object' };
  } else {
    data = {
      type: 'array',
      items: {
        type: 'object',
        properties: { attributes: { properties: attributes } },
      },
    };
    meta = {
      properties: {
        pagination: {
          properties: {
            page: { type: 'integer' },
            pageSize: { type: 'integer', minimum: 25 },
            pageCount: { type: 'integer', maximum: 1 },
            total: { type: 'integer' },
          },
        },
      },
    };
  }

  return {
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: {
              properties: {
                data,
                meta,
              },
            },
          },
        },
      },
    },
    tags: [_.upperFirst(route.info.apiName)],
  };
};
