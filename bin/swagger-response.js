"use strict";
const enforcer          = require('./enforcer');
const scheams           = require('./schemas');
const signature         = require('./signature');

module.exports = SwaggerResponse;

/**
 * Get a managed object that will automatically make sure that you don't set values that you shouldn't.
 * If the response schema is not an object though then this function will throw an error.
 * @param {Object} schema The response schema to build objects from.
 * @param {Object} [options={}] Options to apply to the response enforcer.
 * @throws {Error} in case of unexpected structure.
 * @returns {object}
 */
function SwaggerResponse(schema, options) {
    const config = scheams.response.normalize(options);
    const type = enforcer.getSchemaType(schema);
    const typeIsObject = type === 'object';

    // validate that the schema is not for primitives
    if (!typeIsObject && type !== 'array') {
        const err = Error('SwaggerResponse can only be enforced if the schema is an array or object.');
        err.code = 'ESRENF';
        throw err;
    }

    // if using enum then add enum signatures
    if (config.enum) schema = enumSignatures(schema);

    // return a function that enforces data
    return function(value) {
        return enforcer.validate(schema, '', config, value, false);
    };
}

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
                    let value = item[key];
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
 * @param {object} schema The schema to enforce.
 * @returns {boolean}
 */
SwaggerResponse.enforceable = function(schema) {
    const type = enforcer.getSchemaType(schema);
    return type === 'object' || type === 'array';
};

function enumSignatures(schema) {
    if (Array.isArray(schema)) {
        const copy = [];
        schema.forEach(item => copy.push(enumSignatures(item)));
        return copy;

    } else if (schema && typeof schema === 'object') {
        const copy = {};
        Object.keys(schema).forEach(key => {
            if (key === 'enum') {
                copy.enum = [];
                schema[key].forEach(item => {
                    copy.enum.push(signature(item));
                });
            } else {
                copy[key] = enumSignatures(schema[key]);
            }
        });
        return copy;

    } else {
        return schema;
    }
}

function injectorReplacement(rxGenerator) {
    return function(value, data) {
        const rx = rxGenerator();
        let match;
        while (match = rx.exec(value)) {
            const property = match[1];
            if (data.hasOwnProperty(property)) value = value.replace(match[0], data[property]);
        }
        return value;
    };
}