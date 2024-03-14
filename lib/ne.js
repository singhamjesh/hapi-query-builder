const { keys } = require('lodash');
const { ObjectId } = require('mongodb');
const { strToNumber } = require('./helper');
const { removeElements, filterByEndsWith } = require('./filterStrings');

/**
 * Remove spacial character from query text value
 * @param {*} text query text
 * @return {*} text
 */
const neQueryBuilder = async (requestQuery) => {
  const where = {};
  /* Filter [$in] in query from  request query */
  const neOperators = await filterByEndsWith(requestQuery, '[$ne]');

  /* if [$in] in query then create $in query */
  if (keys(neOperators).length > 0) {
    keys(neOperators).forEach((key) => {
      const field = key.replace('[$ne]', '').trim();
      if (ObjectId.isValid(neOperators[key])) {
        where[field] = { $ne: ObjectId.createFromHexString(neOperators[key]) };
      } else if (neOperators[key] === 'true' || neOperators[key] === 'false') {
        where[field] = { $ne: neOperators[key] === 'true' };
      } else {
        where[field] = { $ne: strToNumber(neOperators[key]) };
      }
    });
  }

  /* Remove In operator query from request query */
  await removeElements(neOperators, requestQuery);
  return where;
};

module.exports = {
  neQueryBuilder,
};
