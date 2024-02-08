const Joi = require('joi');
const Boom = require('@hapi/boom');
const { assign } = require('lodash');
const Mongoose = require('mongoose');
const Package = require('./package');
const { strToNumber } = require('./lib/helper');
const { removeElements, filterByStartsWith } = require('./lib/filterStrings');
const { searchQueryHandler } = require('./lib/search');
const { inOrNotInQueryBuilder } = require('./lib/inOrNotIn');
const { gtOrGteQueryBuilder } = require('./lib/gtOrGte');
const { ltOrLteQueryBuilder } = require('./lib/ltOrLte');
const { neQueryBuilder } = require('./lib/ne');
const { orQueryHandler } = require('./lib/orQuery');

/* Validate query builder options with given schema */
const schema = {
  optionsSchema: Joi.object({
    defaultLimit: Joi.number().integer().default(50),
  }),
};

/**
 * This method is responsible for create parsedQuery object
 * @param {*} requestQuery request query
 * @return {*} where object
 * @return {*} option object
 */
const _hapiQueryBuilderHandler = async (requestQuery) => {
  try {
    /* Hack due to bug in hapi-swagger-docs */
    delete requestQuery[''];
    delete requestQuery.$count;

    /* Check version and remove from query */
    let version = requestQuery.v;
    if (!version) version = 1;
    delete requestQuery.v;

    /* Filter dollar query option in request query */
    const dollarQuery = await filterByStartsWith(requestQuery, '$');

    /* Remove dollar query from request query */
    await removeElements(dollarQuery, requestQuery);

    /* Create $in or $nin mongoose query */
    const inOrNotInQuery = await inOrNotInQueryBuilder(requestQuery);

    /* Create $gt(Greater then) or $gte(Greater then equal to) mongoose query */
    const gtOrGteQuery = await gtOrGteQueryBuilder(requestQuery);

    /* Create $lt(Less then) or $lte(Less then equal to) mongoose query */
    const ltOrLteQuery = await ltOrLteQueryBuilder(requestQuery);

    /* Create $ne(not equal to) mongoose query */
    const neQuery = await neQueryBuilder(requestQuery);

    /* Filter dollar operator form request query object */
    const operatorQuery = await filterByStartsWith(requestQuery, '$', false);

    /*  Create condition with query operation operator and delete objQuery key */
    Object.keys(operatorQuery).forEach((ele) => {
      delete requestQuery[ele];
      const opKey = operatorQuery[ele].split('|')[0];
      const opVal = operatorQuery[ele].split('|')[1];
      operatorQuery[ele] = {};
      if (Mongoose.Types.ObjectId.isValid(item)) {
        operatorQuery[ele][opKey] = Mongoose.Types.ObjectId(opVal);
      } else if (item === 'true' || item === 'false') {
        operatorQuery[ele][opKey] = opVal === 'true';
      } else {
        operatorQuery[ele][opKey] = strToNumber(opVal);
      }
    });

    const searchQuery = await searchQueryHandler(dollarQuery);

    for (const item in requestQuery) {
      if (
        Mongoose.Types.ObjectId.isValid(requestQuery[item]) &&
        requestQuery[item].length === 24
      ) {
        requestQuery[item] = Mongoose.Types.ObjectId(requestQuery[item]);
      } else if (
        requestQuery[item] === 'true' ||
        requestQuery[item] === 'false'
      ) {
        requestQuery[item] = requestQuery[item] === 'true';
      } else {
        requestQuery[item] = strToNumber(requestQuery[item]);
      }
    }

    /* Filter OR operator */
    const orQuery = await orQueryHandler(dollarQuery);

    const where = {
      ...requestQuery,
      ...operatorQuery,
      ...searchQuery,
      ...inOrNotInQuery,
      ...gtOrGteQuery,
      ...ltOrLteQuery,
      ...neQuery,
      ...orQuery,
    };

    let options = { lean: true };

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
        sort[key] = item.split('|')[1];
      });
      options = assign(options, { sort });
    }

    /* Select field query, By default its undefined */
    let selectQuery = dollarQuery.$select;
    if (!selectQuery && version == 2) {
      selectQuery = '_id';
    }
    options = assign(options, { select: selectQuery });

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
        // options.defaultLimit,
      );
    }
    return h.continue;
  });
};

/**
 * This method trigger manually when user call
 * Its a helper method. to use this you can get query from another REST method also
 * @param {Hapi request obj} requestQuery request query object
 * @param { Number } defaultLimit default record limit
 * @return {where, options} in object
 */
exports.QueryMaker = async (requestQuery, defaultLimit = 100) => {
  if (!requestQuery || !defaultLimit) {
    throw new Error('Invalid request parameters');
  }
  return await _hapiQueryBuilderHandler(requestQuery);
};
