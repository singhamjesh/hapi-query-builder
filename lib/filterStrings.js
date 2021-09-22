const { keys, isEqual, pickBy, endsWith, startsWith } = require('lodash');
/**
 * This function is responsible for remove elements from given object
 * Its update reference object
 * @param {*} filterValue  element by remove
 * @param {*} requestQuery object from remove
 */
const removeElements = async (filterValue, requestQuery) => {
  keys(filterValue).forEach((ele) => {
    delete requestQuery[ele];
  });
};

/**
 * This function is responsible for filter by end with sub string
 * Find by lodash.endsWith
 * @param {*} requestQuery  request query params
 * @param {String} subString sub string by filter
 * @param {Boolean} isKeyBy you search by key or value default value key
 */
const filterByEndsWith = async (requestQuery, subString, isKeyBy = true) => {
  filterValue = pickBy(requestQuery, function (value, key) {
    if (isKeyBy) {
      return endsWith(key, subString);
    } else {
      return endsWith(value, subString);
    }
  });
  return filterValue;
};

/**
 * This function is responsible for filter by startsWith string
 * Find by lodash.startsWith
 * @param {*} requestQuery  request query params
 * @param {String} string sub string by filter
 * @param {Boolean} isKeyBy you search by key or value default value key
 */
const filterByStartsWith = async (requestQuery, string, isKeyBy = true) => {
  filterValue = pickBy(requestQuery, function (value, key) {
    if (isKeyBy) {
      return startsWith(key, string);
    } else {
      return startsWith(value, string);
    }
  });
  return filterValue;
};

/**
 * This function is responsible for filter by string equal to string
 * Find by === operator
 * @param {*} requestQuery  request query params
 * @param {String} string sub string by filter
 * @param {Boolean} isKeyBy you search by key or value default value key
 */
const filterByEqString = async (requestQuery, string, isKeyBy = true) => {
  const filterValue = pickBy(requestQuery, function (value, key) {
    if (isKeyBy) {
      return isEqual(key, string);
    } else {
      return isEqual(value, string);
    }
  });
  return filterValue;
};

module.exports = {
  removeElements,
  filterByEndsWith,
  filterByStartsWith,
  filterByEqString,
};
