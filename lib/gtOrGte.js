const { keys } = require('lodash');
const { removeElements, filterByEndsWith } = require('./filterStrings');

/**
 * Remove spacial character from query text value
 * @param {*} text query text
 * @return {*} text
 */
const gtOrGteQueryBuilder = async (requestQuery) => {
  const where = {};
  /* Filter [$in] in query from  request query */
  const gtOperators = await filterByEndsWith(requestQuery, '[$gt]');

  /* if [$in] in query then create $in query */
  if (keys(gtOperators).length > 0) {
    keys(gtOperators).forEach((key) => {
      const field = key.replace('[$gt]', '').trim();
      where[field] = { $gt: gtOperators[key] };
    });
  }

  /* Filter [$nin] in query from  request query */
  const gteOperators = await filterByEndsWith(requestQuery, '[$gte]');

  /* if [$nin] in query then create $nin query */
  if (keys(gteOperators).length > 0) {
    keys(gteOperators).forEach((key) => {
      const field = key.replace('[$gte]', '').trim();
      where[field] = { $gte: gteOperators[key] };
    });
  }

  /* Remove In operator query from request query */
  const removeObjects = { ...gtOperators, ...gteOperators };
  await removeElements(removeObjects, requestQuery);
  return where;
};

module.exports = {
  gtOrGteQueryBuilder,
};
