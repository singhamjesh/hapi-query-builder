const Joi = require('joi');
const Boom = require('@hapi/boom');
const { assign } = require('lodash');
const Package = require('./package');
const { handleNumberType, handleOrInWhereObject } = require('./lib/helper');
const { removeElements, filterByStartsWith } = require('./lib/filterStrings');
const { inOrNotInQueryBuilder } = require('./lib/inOrNotIn');
const { gtOrGteQueryBuilder } = require('./lib/gtOrGte');
const { ltOrLteQueryBuilder } = require('./lib/ltOrLte');
const { neQueryBuilder } = require('./lib/ne');
const { orQueryHandler } = require('./lib/orQuery');
const {
  searchQueryHandler,
  isearchQueryHandler,
  searchInFieldsHandler,
  fullTextSearchQueryHandler,
} = require('./lib/search');

/* Validate query builder options with given schema */
const schema = {
  optionsSchema: Joi.object({
    defaultSelectField: Joi.string()
      .optional()
      .allow('_id', 'all')
      .default('all'),
  }),
};

/**
 * This method is responsible for create parsedQuery object
 * @param {*} requestQuery request query
 * @return {*} where object
 * @return {*} option object
 */
const _hapiQueryBuilderHandler = async (requestQuery, defaultSelectField) => {
  try {
    /* Hack due to bug in hapi-swagger-docs */
    delete requestQuery[''];
    delete requestQuery.$count;

    /* Filter dollar query option in request query */
    const dollarQuery = await filterByStartsWith(requestQuery, '$');

    /* Remove dollar query from request query */
    await removeElements(dollarQuery, requestQuery);

    /* Create $in or $nin mongodb query */
    const inOrNotInQuery = await inOrNotInQueryBuilder(requestQuery);

    /* Create $gt(Greater then) or $gte(Greater then equal to) mongodb query */
    const gtOrGteQuery = await gtOrGteQueryBuilder(requestQuery);

    /* Create $lt(Less then) or $lte(Less then equal to) mongodb query */
    const ltOrLteQuery = await ltOrLteQueryBuilder(requestQuery);

    /* Create $ne(not equal to) mongodb query */
    const neQuery = await neQueryBuilder(requestQuery);

    /* Filter dollar operator form request query object */
    const operatorQuery = await filterByStartsWith(requestQuery, '$', false);

    /*  Create condition with query operation operator and delete objQuery key */
    Object.keys(operatorQuery).forEach((ele) => {
      delete requestQuery[ele];
      const opKey = operatorQuery[ele].split('|')[0];
      const opVal = operatorQuery[ele].split('|')[1];
      operatorQuery[ele][opKey] = handleNumberType(opVal);
    });

    for (const item in requestQuery) {
      requestQuery[item] = handleNumberType(requestQuery[item]);
    }

    /* Default options for mongodb query */
    let options = { lean: true };

    /* Create search query with case sensitive */
    const searchQuery = await searchQueryHandler(dollarQuery);

    /* Create search query without case sensitive */
    const isearchQuery = await isearchQueryHandler(dollarQuery);

    /* Create where object */
    let where = {
      ...requestQuery,
      ...operatorQuery,
      ...inOrNotInQuery,
      ...gtOrGteQuery,
      ...ltOrLteQuery,
      ...neQuery,
      ...searchQuery,
      ...isearchQuery,
    };

    /* Make mongodb fields search query */
    const fieldSearchQuery = await searchInFieldsHandler(dollarQuery);
    where = handleOrInWhereObject(where, fieldSearchQuery);

    /* Make mongodb fields full search query */
    const fullTextSearchQuery = await fullTextSearchQueryHandler(dollarQuery);
    where = handleOrInWhereObject(where, fullTextSearchQuery);

    /* Filter OR operator */
    const orQuery = await orQueryHandler(dollarQuery);
    where = handleOrInWhereObject(where, orQuery);

    /* Get limit from request query either env variable */
    if (dollarQuery.$limit) {
      options = assign(options, { limit: parseInt(dollarQuery.$limit) });
    }

    /* Get skip from request query either it set 0 */
    if (dollarQuery.$skip) {
      options = assign(options, { offset: parseInt(dollarQuery.$skip) });
    }

    /* Prepare Sort query for mongodb from request query */
    const sort = {};
    if (dollarQuery.$sort) {
      const sortArray = dollarQuery.$sort.split(',');
      sortArray.forEach((item) => {
        const key = item.split('|')[0];
        const val = item.split('|')[1];
        if (val === '1' || val === 'asc') {
          sort[key] = 1;
        } else if (val === '-1' || val === 'desc') {
          sort[key] = -1;
        }
      });
      options = assign(options, { sort });
    }

    /* Select field query, By default its undefined */
    let selectQuery = dollarQuery.$select;
    if (
      !selectQuery &&
      defaultSelectField &&
      defaultSelectField.toLowerCase() !== 'all'
    ) {
      selectQuery = '_id';
    }
    if (selectQuery) {
      options = assign(options, { select: selectQuery });
    }

    /* Create Populate according to its value */
    let populate = dollarQuery.$populate;
    if (populate) {
      populate = populate.split(',');
      options = assign(options, { populate });
    }
    return { where, options };
  } catch (err) {
    throw new Boom.Boom(err, { statusCode: 400 });
  }
};

/* Export query builder package name */
exports.name = Package.name;

/* Export query builder package version */
exports.version = Package.version;

/* Register hapi query builder plugin */
exports.register = (server, options) => {
  const validateOptions = schema.optionsSchema.validate(options);
  if (validateOptions.error) {
    throw new Error(validateOptions.error);
  }

  /* Use the validated and maybe converted values from Joi */
  options = validateOptions.value;

  /**
   * Query builder trigger on only get method otherwise its skip automatically
   * @param {Hapi request obj} request request object
   * @param {hapi handler} h response object
   * @return {where, options} in parsedQuery
   */
  server.ext('onPreHandler', async function (request, h) {
    if (request.method === 'get') {
      request.parsedQuery = await _hapiQueryBuilderHandler(
        request.query,
        options.defaultSelectField,
      );
    }
    return h.continue;
  });
};

/**
 * This method trigger manually when user call
 * Its a helper method. to use this you can get query from another REST method also
 * @param {Hapi request obj} requestQuery request query object
 * @param { Number } defaultSelectField default record limit
 * @return {where, options} in object
 */
exports.QueryMaker = async (requestQuery, defaultSelectField = 'all') => {
  if (!requestQuery || !defaultSelectField) {
    throw new Error('Invalid request parameters');
  }
  return await _hapiQueryBuilderHandler(requestQuery, defaultSelectField);
};
