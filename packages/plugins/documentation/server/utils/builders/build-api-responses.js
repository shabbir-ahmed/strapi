'use strict';

const getData = (actionType, attributes) => {
  if (actionType === 'find') {
    return {
      type: 'array',
      items: {
        type: 'object',
        properties: { attributes: { properties: attributes } },
      },
    };
  }

  return {
    type: 'object',
    properties: { attributes: { properties: attributes } },
  };
};

const getMeta = actionType => {
  if (actionType === 'find') {
    return {
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

  return { type: 'object' };
};

module.exports = (attributes, route) => {
  const actionType = route.split('.').pop();

  let schema;
  if (route.method === 'DELETE') {
    schema = {
      type: 'integer',
      format: 'int64',
    };
  } else {
    schema = {
      properties: {
        data: getData(actionType, attributes),
        meta: getMeta(actionType),
      },
    };
  }

  return {
    responses: {
      '200': {
        content: {
          'application/json': {
            schema,
          },
        },
      },
    },
  };
};
