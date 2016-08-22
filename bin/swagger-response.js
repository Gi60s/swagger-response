"use strict";
const fs                = require('fs');
const helper            = require('./helper');
const Promise           = require('bluebird');
const SchemaProxies     = require('./schema-proxies');
const SchemaSanProxies  = require('./schema-san-proxies');
const tools             = require('swagger-tools');
const yaml              = require('js-yaml');

const metadata = function(req, swaggerObject) {
    const res = {};
    return new Promise(function(resolve, reject) {
        tools.initializeMiddleware(swaggerObject, function(middleware) {
            middleware.swaggerMetadata(swaggerObject)(req, res, function(err, data) {
                if (err) return reject(err);
                resolve(data);
            });
        });
    });
};
const readFile = Promise.promisify(fs.readFile, { context: fs });

module.exports = SwaggerResponse;

/**
 * Get a managed object that will automatically make sure that you don't set values that you shouldn't.
 * If the response schema is not an object though then this function will throw an error.
 * @param {IncomingMessage, object} req
 * @param {string, number} responseCode
 * @param {object} [options={}]
 * @returns {object}
 * @throws {Error} in case of unexpected structure.
 * @constructor
 */
function SwaggerResponse(req, responseCode, options) {

    // normalize options
    if (!options) options = {};
    if (!options.hasOwnProperty('proxies')) options.proxies = true; // allow proxies if supported

    // get the correct schema builder
    const Schema = helper.supportsProxies() && options.proxies ? SchemaProxies : SchemaSanProxies;

    // get the responses value
    const responses = helper.getPropertyChainValue(req, 'swagger.operation.responses', '');

    // get the schema definition
    const schema = helper.getPropertyChainValue(responses, responseCode + '.schema', '');

    // validate that the type is not primitive
    const type = helper.getPropertyType(schema);
    if (type !== 'object' && type !== 'array') {
        throw Error('SwaggerResponse can only be managed if the schema is an array or object.');
    }

    // build the schema object
    if (type === 'object') {
        return Schema.object(schema, []);
    } else {
        return Schema.array(schema, []);
    }
}

/**
 * Get a swagger response object that is isolated from a server request object. This is useful
 * when you don't have a http server that has formed the request.
 * @param {object} req The request object
 * @param {string, number} responseCode
 * @param {string} swaggerFilePath
 */
SwaggerResponse.lambda = function(req, responseCode, swaggerFilePath) {

    //validate input parameters
    if (!req || typeof req !== 'object') return Promise.reject('Invalid request object: ' + req);
    if (!/\.(?:json|yaml)$/i.test(swaggerFilePath)) return Promise.reject('The swagger definition file path must be either a .yaml or .json file.');

    return readFile(swaggerFilePath, 'utf8')
        .then(function(content) {
            const swaggerObject = /\.json$/i.test(swaggerFilePath) ?
                JSON.parse(content) :
                yaml.safeLoad(content);

            // set request defaults
            if (!req.hasOwnProperty('headers')) req.headers = {};
            if (!req.headers.hasOwnProperty('content-type')) req.headers['content-type'] =
                swaggerObject.hasOwnProperty('produces') && Array.isArray(swaggerObject.produces) && swaggerObject.produces.length > 0 ?
                    swaggerObject.produces[0] :
                    'application/json';;
            if (!req.hasOwnProperty('method')) req.method = 'GET';
            if (!req.hasOwnProperty('url')) req.url = '/';

            return metadata(req, swaggerObject);
        })
        .then(function() {
            return SwaggerResponse(req, responseCode);
        });
};

/**
 * Look for property values that are strings and perform variable value substitution. If a
 * string has a "{varName}" in it and the data object has a "varName" property then the
 * value from that property is cast to a string and injected in place of "{varName}".
 * @param {boolean} [recursive=true] Whether to recursively look for strings in sub-objects.
 * @param {object, object[]} obj The object (or objects) to perform substitution on.
 * @param {object} data The data object to use to identify string substitutions and to
 * provide values.
 */
SwaggerResponse.injectParameters = function(recursive, obj, data) {

    if (arguments.length === 2) {
        obj = arguments[0];
        data = arguments[1];
        recursive = true;
    }

    return inject(recursive, obj);

    function inject(recursive, obj) {
        const array = Array.isArray(obj) ? obj : [obj];
        array.forEach(function(item) {
            if (item && typeof item === 'object') {
                Object.keys(item).forEach(function(key) {
                    var value = item[key];
                    if (typeof value === 'string') {
                        value = SwaggerResponse.injectParameterPattern(value, data);
                        item[key] = value;
                    } else if (recursive && value && typeof value === 'object') {
                        inject(true, value);
                    }
                });
            }
        });
    }
};

/**
 * Some pre-programmed injector patterns to use for replacing placeholder values with actual values.
 * @type {{colon, doubleHandlebar, handlebar}}
 */
SwaggerResponse.injectorPatterns = {
    colon: injectorReplacement(function() { return /:([_$a-z][_$a-z0-9]*)/ig }),
    doubleHandlebar: injectorReplacement(function() { return /{{([_$a-z][_$a-z0-9]*)}}/ig }),
    handlebar: injectorReplacement(function() { return /{([_$a-z][_$a-z0-9]*)}/ig })
};

/**
 * Set the default injector pattern to use handlebar replacement.
 */
SwaggerResponse.injectParameterPattern = SwaggerResponse.injectorPatterns.handlebar;

/**
 * Determine whether the response can be managed. This will be false unless the response schema returns
 * an object or an array.
 * @param {IncomingMessage} req
 * @param {string, number} [responseCode=default]
 * @returns {boolean}
 */
SwaggerResponse.manageable = function(req, responseCode) {
    try {
        if (arguments.length === 1) responseCode = 'default';
        responseCode = '' + responseCode;
        const responses = helper.getPropertyChainValue(req, 'swagger.operation.responses', '');
        const schema = helper.getPropertyChainValue(responses, responseCode + '.schema', '');
        const type = helper.getPropertyType(schema);
        return type === 'object' || type === 'array';
    } catch (e) {
        return false;
    }
};

function injectorReplacement(rxGenerator) {
    return function(value, data) {
        var rx = rxGenerator();
        var match;
        var property;
        while (match = rx.exec(value)) {
            property = match[1];
            if (data.hasOwnProperty(property)) {
                value = value.replace(match[0], data[property]);
            }
        }
        return value;
    };
}