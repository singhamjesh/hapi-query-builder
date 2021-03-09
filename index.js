const Joi = require('joi');
const Boom = require('@hapi/boom');
const _ = require('lodash');
const Package = require('./package');

/* Validate query builder options with given schema */
const schema = {
  optionsSchema: Joi.object({
    defaultLimit: Joi.number().integer().default(50),
  }),
};

/**
 * Remove spacial character from query text value
 * @param {*} text query text
 * @return {*} text
 */
const _formatSpecialChar = async (text) => {
  try {
    text = text.replace('+', '\\+');
    text = text.replace('-', '\\-');
    return text;
  } catch (err) {
    throw new Boom.Boom(err, { statusCode: 400 });
  }
};

/**
 * Create search query according to query params
 * @param {*} text
 */
const _searchQueryHandler = async (dollarQuery) => {
  const where = {};

  /* Filter $search from query */
  const searchQuery = _.pickBy(dollarQuery, function (value, key) {
    return key === '$search';
  });

  /* Create Search query params with case sensitive for and condition */
  if (dollarQuery.$search) {
    if (_.isArray(searchQuery.$search)) {
      searchQuery.$search.forEach(async (ele) => {
        const search = ele.split('|');
        const text = await _formatSpecialChar(search[1]);
        where[search[0]] = {
          $regex: new RegExp(text),
        };
      });
    } else {
      const search = searchQuery.$search.split('|');
      const text = await _formatSpecialChar(search[1]);
      where[search[0]] = {
        $regex: new RegExp(text),
      };
    }
  }

  /* Filter $isearch from query */
  const isearchQuery = _.pickBy(dollarQuery, function (value, key) {
    return key === '$isearch';
  });

  /* Create Search query params without case sensitive for and condition */
  if (dollarQuery.$isearch) {
    if (_.isArray(isearchQuery.$isearch)) {
      isearchQuery.$isearch.forEach(async (ele) => {
        const isearch = ele.split('|');
        const text = await _formatSpecialChar(isearch[1]);
        where[isearch[0]] = {
          $regex: new RegExp(text),
          $options: 'i',
        };
      });
    } else {
      const isearch = isearchQuery.$isearch.split('|');
      const text = await _formatSpecialChar(isearch[1]);
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
    const text = await _formatSpecialChar(orSearch[1]);
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
    const text = await _formatSpecialChar(iorSearch[1]);
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
 * This method is responsible for create parsedQuery object
 * @param {*} requestQuery request query
 * @return {*} where object
 * @return {*} option object
 */
const _hapiQueryBuilderHandler = async (requestQuery, defaultLimit) => {
  try {
    /* Hack due to bug in hapi-swagger-docs */
    delete requestQuery[''];
    delete requestQuery.$count;

    /* Check version and remove from query */
    let version = requestQuery.v;
    if (!version) version = 1;
    delete requestQuery.v;

    /* Filter dollar query option in request query */
    const dollarQuery = _.pickBy(requestQuery, function (value, key) {
      return _.startsWith(key, '$');
    });

    /* Remove dollar query from request query */
    Object.keys(dollarQuery).forEach((ele) => {
      delete requestQuery[ele];
    });

    /* Filter dollar operator form request query object */
    const operatorQuery = _.pickBy(requestQuery, function (value, key) {
      return _.startsWith(value, '$');
    });

    /*  Create condition with query operation operator  and delete objQuery key */
    Object.keys(operatorQuery).forEach((ele) => {
      delete requestQuery[ele];
      const opKey = operatorQuery[ele].split('|')[0];
      const opVal = operatorQuery[ele].split('|')[1];
      operatorQuery[ele] = {};
      operatorQuery[ele][opKey] = opVal;
    });

    const searchQuery = await _searchQueryHandler(dollarQuery);

    const where = {
      ...requestQuery,
      ...operatorQuery,
      ...searchQuery,
    };

    /* Get limit from request query either env variable */
    const limit = dollarQuery.$limit
      ? parseInt(dollarQuery.$limit)
      : parseInt(defaultLimit);

    /* Get skip from request query either it set 0 */
    const skip = dollarQuery.$skip ? parseInt(dollarQuery.$skip) : 0;

    /* Prepare Sort query for mongodb from request query */
    const sort = {};
    if (dollarQuery.$sort) {
      const key = dollarQuery.$sort.split('|')[0];
      sort[key] = dollarQuery.$sort.split('|')[1];
    }

    /* Select field query, By default its undefined */
    let selectQuery = dollarQuery.$select;
    if (!selectQuery && version == 2) {
      selectQuery = '_id';
    }

    /* Create option object */
    let options = {};

    /* Create Populate according to its value */
    let populate = dollarQuery.$populate;
    if (populate) {
      populate = populate.split(',');
      options = _.assign(options, { populate });
    }

    options = _.assign(options, {
      select: selectQuery,
      lean: true,
      offset: skip,
      limit: limit,
      sort: sort,
    });

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
        options.defaultLimit,
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
  return await _hapiQueryBuilderHandler(requestQuery, defaultLimit);
};
