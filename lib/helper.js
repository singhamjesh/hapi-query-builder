const Boom = require('@hapi/boom');

/**
 * Remove spacial character from query text value
 * @param {*} text query text
 * @return {*} text
 */
const formatSpecialChar = async (text) => {
  try {
    text = text.replace('+', '\\+');
    text = text.replace('-', '\\-');
    return text;
  } catch (err) {
    throw new Boom.Boom(err, { statusCode: 400 });
  }
};

module.exports = {
  formatSpecialChar,
};
