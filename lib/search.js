const { isArray } = require('lodash');
const { filterByEqString } = require('./filterStrings');
const { formatSpecialChar, searchQueryWithFields } = require('./helper');

/**
 * Create search query according to query params
 * @param {array} dollarQuery dollar query
 * @returns {*} where
 */
const searchQueryHandler = async (dollarQuery) => {
  const where = {};

  /* Filter $search from query */
  const searchQuery = await filterByEqString(dollarQuery, '$search');

  /* Create Search query params with case sensitive for and condition */
  if (dollarQuery.$search) {
    if (isArray(searchQuery.$search)) {
      searchQuery.$search.forEach(async (ele) => {
        const search = ele.split('|');
        const text = await formatSpecialChar(search[1]);
        where[search[0]] = {
          $regex: new RegExp(text),
        };
      });
    } else {
      const search = searchQuery.$search.split('|');
      const text = await formatSpecialChar(search[1]);
      where[search[0]] = {
        $regex: new RegExp(text),
      };
    }
  }

  /* Filter $isearch from query */
  const isearchQuery = await filterByEqString(dollarQuery, '$isearch');

  /* Create Search query params without case sensitive for and condition */
  if (dollarQuery.$isearch) {
    if (isArray(isearchQuery.$isearch)) {
      isearchQuery.$isearch.forEach(async (ele) => {
        const isearch = ele.split('|');
        const text = await formatSpecialChar(isearch[1]);
        where[isearch[0]] = {
          $regex: new RegExp(text),
          $options: 'i',
        };
      });
    } else {
      const isearch = isearchQuery.$isearch.split('|');
      const text = await formatSpecialChar(isearch[1]);
      where[isearch[0]] = {
        $regex: new RegExp(text),
        $options: 'i',
      };
    }
  }

  /* Create Search query params without case sensitive for or condition */
  if (dollarQuery.$searchOr) {
    const orSearch = dollarQuery.$searchOr.split('|');
    const fields = orSearch[0].split(',');
    const text = await formatSpecialChar(orSearch[1]);
    const orQuery = [];
    fields.forEach((ele) => {
      const q = {};
      q[ele] = { $regex: new RegExp(text) };
      orQuery.push(q);
    });

    where.$or = orQuery;
  }

  /* Create Search query params with case sensitive for or condition */
  if (dollarQuery.$isearchOr) {
    const iorSearch = dollarQuery.$isearchOr.split('|');
    const fields = iorSearch[0].split(',');
    const text = await formatSpecialChar(iorSearch[1]);
    const iorQuery = [];
    fields.forEach((ele) => {
      const q = {};
      q[ele] = { $regex: new RegExp(text), $options: 'i' };
      iorQuery.push(q);
    });

    where.$or = iorQuery;
  }
  return where;
};

/**
 * This method is responsible for create mongo search using filed
 * @param {array} dollarQuery dollar query
 * @returns {*} where
 */
const searchInFieldsHandler = async (dollarQuery) => {
  const where = {};

  /* Filter $search from query */
  const searchQuery = await filterByEqString(dollarQuery, '$q');

  /* Return if dollarQuery has not a $or key */
  if (!(searchQuery && searchQuery.$q)) return where;

  /* Break multiple $or filed with , operator */
  const searchQueryArray = searchQuery.$q.split('|');
  if (searchQueryArray.length <= 1) return where;

  const text = searchQueryArray[0];
  const fields = searchQueryArray[1].split(',');
  const query = searchQueryWithFields(fields, text);
  if (query.length > 0) where.$or = query;
  return where;
};

module.exports = {
  searchQueryHandler,
  searchInFieldsHandler,
};
