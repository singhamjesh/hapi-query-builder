const { keys } = require('lodash');
const Mongoose = require('mongoose');
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
      if (Mongoose.Types.ObjectId.isValid(neOperators[key])) {
        where[field] = { $ne: Mongoose.Types.ObjectId(neOperators[key]) };
      } else {
        where[field] = { $ne: neOperators[key] };
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
