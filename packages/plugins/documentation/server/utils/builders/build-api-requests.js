'use strict';
module.exports = attributes => {
  const requiredAttributes = Object.entries(attributes)
    .filter(([, val]) => {
      return val.required;
    })
    .map(([attr, val]) => {
      return { [attr]: val };
    });

  const requestAttributes = requiredAttributes.length
    ? Object.assign({}, ...requiredAttributes)
    : attributes;

  return {
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            properties: {
              data: {
                type: 'object',
                properties: requestAttributes,
              },
            },
          },
        },
      },
    },
  };
};
