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

/**
   * This method is return true if number is in string formate
   * @param {*} str string
   * @returns {Boolean} true/false
   */
 const isNumeric= (str) => {
  if (typeof str !== 'string') return false;
  return !isNaN(str) && !isNaN(parseFloat(str));
};

/**
 * This method is convert numeric string in number
 * @param {*} str string
 * @returns {Number} converted string
 */
 const strToNumber =(str) => {
  if (isNumeric(str)) {
    return parseFloat(str);
  }
  return str;
};

module.exports = {
  isNumeric,
  strToNumber,
  formatSpecialChar,
};
