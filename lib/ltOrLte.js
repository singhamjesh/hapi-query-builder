const { keys } = require('lodash');
const { removeElements, filterByEndsWith } = require('./filterStrings');

/**
 * Remove spacial character from query text value
 * @param {*} text query text
 * @return {*} text
 */
const ltOrLteQueryBuilder = async (requestQuery) => {
  const where = {};
  /* Filter [$in] in query from  request query */
  const ltOperators = await filterByEndsWith(requestQuery, '[$lt]');

  /* if [$in] in query then create $in query */
  if (keys(ltOperators).length > 0) {
    keys(ltOperators).forEach((key) => {
      const field = key.replace('[$lt]', '').trim();
      where[field] = { $lt: ltOperators[key] };
    });
  }

  /* Filter [$nin] in query from  request query */
  const lteOperators = await filterByEndsWith(requestQuery, '[$lte]');

  /* if [$nin] in query then create $nin query */
  if (keys(lteOperators).length > 0) {
    keys(lteOperators).forEach((key) => {
      const field = key.replace('[$lte]', '').trim();
      where[field] = { $lte: lteOperators[key] };
    });
  }

  /* Remove In operator query from request query */
  const removeObjects = { ...ltOperators, ...lteOperators };
  await removeElements(removeObjects, requestQuery);
  return where;
};

module.exports = {
  ltOrLteQueryBuilder,
};
