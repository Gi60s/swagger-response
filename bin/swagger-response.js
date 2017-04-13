"use strict";
const enforcer          = require('./enforcer');
const scheams           = require('./schemas');

module.exports = SwaggerResponse;

/**
 * Get a managed object that will automatically make sure that you don't set values that you shouldn't.
 * If the response schema is not an object though then this function will throw an error.
 * @param {Object} schema The response schema to build objects from.
 * @param {Object} [options={}] Options to apply to the response enforcer.
 * @param {*} [initial] The initial value to apply for the response.
 * @throws {Error} in case of unexpected structure.
 * @returns {object}
 */
function SwaggerResponse(schema, options, initial) {
    return enforcer(schema, options || {}, initial);
}