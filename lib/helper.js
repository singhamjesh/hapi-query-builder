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
const isNumeric = (str) => {
  if (typeof str !== 'string') return false;
  return !isNaN(str) && !isNaN(parseFloat(str));
};

/**
 * This method is convert numeric string in number
 * @param {*} str string
 * @returns {Number} converted string
 */
const strToNumber = (str) => {
  if (isNumeric(str)) {
    return parseFloat(str);
  }
  return str;
};

/**
 * This method is responsible for create mongo search using filed
 *
 * @param {array} fields db field name
 * @return {array} query array
 */
const searchQueryWithFields = (fields, q) => {
  return fields.map((field) => {
    return { [field]: { $regex: q, $options: 'i' } };
  });
};

/**
 * This method is responsible for handle or operator in where object
 * @param {*} where where object
 * @param {*} query query object
 * @return {*} where object
 */
const handleOrInWhereObject = (where, query) => {
  if (where.$or && query.$or) {
    where.$or = [...where.$or, ...query.$or];
  } else {
    where = { ...where, ...query };
  }
  return where;
};

module.exports = {
  isNumeric,
  strToNumber,
  formatSpecialChar,
  searchQueryWithFields,
  handleOrInWhereObject,
};
