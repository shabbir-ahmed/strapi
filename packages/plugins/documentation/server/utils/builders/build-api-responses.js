'use strict';

const getData = (hasParams, attributes) => {
  // const requiredAttributes = Object.keys(attributes).filter(key => attributes[key].required);

  if (hasParams) {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        attributes: { type: 'object', properties: attributes },
      },
    };
  }

  return {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        attributes: { type: 'object', properties: attributes },
      },
    },
  };
};

const getMeta = hasParams => {
  if (hasParams) {
    return { type: 'object' };
  }

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
};

module.exports = (attributes, route, hasParams = false) => {
  let schema;
  if (route.method === 'DELETE') {
    schema = {
      type: 'integer',
      format: 'int64',
    };
  } else {
    schema = {
      properties: {
        data: getData(hasParams, attributes),
        meta: getMeta(hasParams),
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
