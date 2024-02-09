const Mongoose = require('mongoose');
const { filterByEqString } = require('./filterStrings');
const { searchQueryWithFields, handleType } = require('./helper');

/**
 * Create search query according to query params
 * @param {array} dollarQuery dollar query
 * @returns {*} where
 */
const searchQueryHandler = async (dollarQuery) => {
  const where = {};

  /* Filter $search from query */
  const searchQuery = await filterByEqString(dollarQuery, '$search');

  /* Return if dollarQuery has not a $search key */
  if (!(searchQuery && searchQuery.$search)) return where;

  /* Break multiple $search filed with , operator */
  const searchQueryArray = searchQuery.$search.split(',');
  if (searchQueryArray.length <= 0) return where;

  if (searchQueryArray.length === 1) {
    const search = searchQueryArray[0].split('|');
    if (search.length <= 0) return where;
    where[search[0]] = handleType(search[1], true, false);
  } else {
    const or = [];
    for (const ele of searchQueryArray) {
      const search = ele.split('|');
      if (search.length <= 0) continue;
      or.push({ [search[0]]: handleType(search[1], true, false) });
    }
    where.$or = or;
  }

  return where;
};

/**
 * Create search query according to query params
 * @param {array} dollarQuery dollar query
 * @returns {*} where
 */
const isearchQueryHandler = async (dollarQuery) => {
  const where = {};

  /* Filter $isearch from query */
  const searchQuery = await filterByEqString(dollarQuery, '$isearch');

  /* Return if dollarQuery has not a $isearch key */
  if (!(searchQuery && searchQuery.$isearch)) return where;

  /* Break multiple $isearch filed with , operator */
  const searchQueryArray = searchQuery.$isearch.split(',');
  if (searchQueryArray.length <= 0) return where;

  if (searchQueryArray.length === 1) {
    const search = searchQueryArray[0].split('|');
    if (search.length <= 0) return where;
    where[search[0]] = handleType(search[1], true, true);
  } else {
    const or = [];
    for (const ele of searchQueryArray) {
      const search = ele.split('|');
      if (search.length <= 0) continue;
      or.push({ [search[0]]: handleType(search[1], true, true) });
    }
    where.$or = or;
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
  isearchQueryHandler,
  searchInFieldsHandler,
};
