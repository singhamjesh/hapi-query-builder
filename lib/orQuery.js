const { filterByEqString } = require('./filterStrings');

/**
 * Remove spacial character from query text value
 * @param {*} text query text
 * @return {*} text
 */
const orQueryHandler = async (dollarQuery) => {
  const where = {};

  /* Filter $search from query */
  const orQuery = await filterByEqString(dollarQuery, '$or');

  /* Return if dollarQuery has not a $or key */
  if (!(orQuery && orQuery.$or)) return where;

  /* Break multiple $or filed with , operator */
  const orValueArray = orQuery.$or.split(',');
  if (orValueArray.length <= 0) return where;

  /* Make $or mongodb condition */
  const or = [];
  for (const ele of orValueArray) {
    const orValue = ele.split('|');
    if (orValue.length !== 2) continue;
    or.push({ [orValue[0]]: orValue[1] });
  }

  /* Return if or is blank */
  if (or.length > 0) where.$or = or;

  return where;
};

module.exports = { orQueryHandler };
