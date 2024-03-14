const Boom = require('@hapi/boom');
const { ObjectId } = require('mongodb');

/**
 * Remove spacial character from query text value
 * @param {*} text query text
 * @return {*} text
 */
const formatSpecialChar = (text) => {
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
 * This method is responsible for handle number/string/mongo object type
 *
 * @param {*} value value
 * @returns {*} value
 */
const handleNumberType = (value) => {
  if (ObjectId.isValid(value) && value.length === 24) {
    return ObjectId.createFromHexString(value);
  } else if (value === 'true' || value === 'false') {
    return value === 'true';
  }
  return strToNumber(value);
};

/**
 *  This method is responsible for handle data type
 * @param {*} value value
 * @param {*} isRegex is regex
 * @param {*} i is i
 * @returns {*} value
 */
const handleType = (value, isRegex = false, i = false) => {
  if (ObjectId.isValid(value) && value.length === 24) {
    return ObjectId.createFromHexString(value);
  }

  if (value === 'true' || value === 'false') {
    return value === 'true';
  }

  const text = formatSpecialChar(value);
  if (isRegex && i) {
    return {
      $regex: new RegExp(text),
      $options: 'i',
    };
  }

  if (isRegex) {
    return {
      $regex: new RegExp(text),
    };
  }

  return text;
};

/**
 * This method is responsible for create mongo search using filed
 *
 * @param {array} fields db field name
 * @return {array} query array
 */
const searchQueryWithFields = (fields, q) => {
  return fields.map((field) => {
    return { [field]: handleType(q, true, true) };
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
  handleType,
  handleNumberType,
  formatSpecialChar,
  searchQueryWithFields,
  handleOrInWhereObject,
};
