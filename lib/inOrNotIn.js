const { keys } = require('lodash');
const { handleNumberType } = require('./helper');
const { removeElements, filterByEndsWith } = require('./filterStrings');

/**
 * Remove spacial character from query text value
 * @param {*} text query text
 * @return {*} text
 */
const inOrNotInQueryBuilder = async (requestQuery) => {
  const where = {};
  /* Filter [$in] in query from  request query */
  const inOperators = await filterByEndsWith(requestQuery, '[$in]');

  /* if [$in] in query then create $in query */
  if (keys(inOperators).length > 0) {
    keys(inOperators).forEach((key) => {
      const field = key.replace('[$in]', '').trim();
      const inValues = inOperators[key].split(',').map((item) => {
        return handleNumberType(item);
      });
      where[field] = { $in: inValues };
    });
  }

  /* Filter [$nin] in query from  request query */
  const ninOperators = await filterByEndsWith(requestQuery, '[$nin]');

  /* if [$nin] in query then create $nin query */
  if (keys(ninOperators).length > 0) {
    keys(ninOperators).forEach((key) => {
      const field = key.replace('[$nin]', '').trim();
      const ninValues = ninOperators[key].split(',').map((item) => {
        return handleNumberType(item);
      });
      where[field] = { $nin: ninValues };
    });
  }

  /* Remove In operator query from request query */
  const removeObjects = { ...inOperators, ...ninOperators };
  await removeElements(removeObjects, requestQuery);
  return where;
};

module.exports = {
  inOrNotInQueryBuilder,
};
