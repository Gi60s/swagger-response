'use strict';
const rx                = require('./rx');
const signature         = require('./signature');

/**
 * Create an array with schema enforcement.
 * @param {Object} schema The schema definition.
 * @param {string} path The path to this value.
 * @param {object} options The options to apply.
 * @param {Array} initial The array to initialize from.
 * @param {boolean} validated Whether the values in the array have already been validated.
 * @returns {*[]}
 */
exports.array = function(schema, path, options, initial, validated) {
    const uniqueItems = options.enforce.uniqueItems && schema.uniqueItems ? {} : null;

    // initialize input parameters and validate
    if (!Array.isArray(initial)) error('Invalid type: Expected array. Received ' + typeof initial, 'TYPE');
    if (!validated) initial.forEach((item, index) => initial[index] = validate(item, index));

    const proxy = new Proxy(initial, {
        get: function(target, property) {
            switch (property) {
                case '__swaggerResponseType__': return 'array';

                case 'concat': return function(value) {
                    validateValues(arguments, 0, 0);
                    const ar = target.concat.apply(target, arguments);
                    return exports.array(schema, '', options, ar, true);
                };

                case 'copyWithin': return function(index, start, end) {
                    target.copyWithin.apply(target, arguments);
                    return proxy;
                };

                case 'fill': return function(value, start, end) {
                    arguments[0] = exports.validate(schema.items, path + '/' + start, options, value);
                    target.fill.apply(target, arguments);
                    return proxy;
                };

                case 'filter': return function(callback, thisArg) {
                    const ar = target.filter.apply(target, arguments);
                    return exports.array(schema, '', options, ar, true);
                };

                case 'map': return function(callback, thisArg) {
                    const ar = target.map.apply(target, arguments);
                    return exports.array(schema, '', options, ar, false);
                };

                case 'push': return function(value) {
                    validateValues(arguments, 0, target.length);
                    return target.push.apply(target, arguments);
                };

                case 'slice': return function(begin, end) {
                    const ar = target.slice.apply(target, arguments);
                    return exports.array(schema, '', options, ar, true);
                };

                case 'splice': return function(start, deleteCount, item) {
                    const index = typeof deleteCount === 'number' ? 2 : 1;
                    validateValues(arguments, index, start);
                    const ar = target.splice.apply(target, arguments);
                    return exports.array(schema, '', options, ar, true);
                };

                case 'unshift': return function() {
                    validateValues(arguments, 0, 0);
                    return target.unshift.apply(target, arguments);
                };

                default: return target[property];
            }
        },
        set: function(target, property, value) {
            if (!rx.integer.test(property)) error('Invalid array index: ' + property, 'INDX');
            target[property] = exports.validate(schema.items, path + '/' + property, options, value);
            return true;
        }
    });

    return proxy;

    function validate(value, index) {
        const proxy = exports.validate(schema.items, path + '/' + index, options, value);
        if (uniqueItems) {
            const key = signature(proxy);
            if (!uniqueItems[key]) {
                uniqueItems[key] = true;
            } else {
                error('Items must be unique and this item is already exists: ' + value, 'UNIQ');
            }
        }
        return proxy;
    }

    function validateValues(args, start, index) {
        for (let i = start; i < args.length; i++) args[i] = validate(args[i], start + index);
    }
};

exports.getSchemaType = function(schema) {
    if (!schema) return undefined;
    if (schema.type) return schema.type;
    if (schema.items) return 'array';
    if (schema.properties) return 'object';
    return undefined;
};

/**
 * Create an object with schema enforcement.
 * @param {object} schema The schema definition.
 * @param {string} path Position within the map data.
 * @param {Object} options The options.
 * @param {Object} initial The initial value.
 * @param {boolean} validated Whether the initial value has already been validated.
 * @returns {object}
 */
exports.object = function(schema, path, options, initial, validated) {
    const itemType = exports.getSchemaType(schema.properties);

    // initialize input parameters and validate
    if (!initial || typeof initial !== 'object') throw Error('Invalid type: Expected object. Received ' + typeof initial);
    if (!validated) {
        Object.keys(initial)
            .forEach(key => {
                initial[key] = exports.validate(schema.properties, path + '/' + key, options, initial[key])
            });
    }

    return new Proxy(initial, {
        get: function(target, property) {
            switch (property) {
                case '__swaggerResponseSignature__': return null;
                default: return target[property];
            }
        },
        set: function(target, property, value) {
            const fullPath = path + '/' + property;
            if (itemType === 'array') {
                target[property] = exports.array(schema.properties, fullPath, options, value, false);
            } else if (itemType === 'object') {
                target[property] = exports.object(schema.properties, fullPath, options, value, false);
            } else {
                exports.validate(schema.properties, fullPath, options, value);
                target[property] = value;
            }
            return true;
        }
    });

    function validate(value) {
        // TODO: account for allOf, additionalProperties
    }
};

/**
 * General validation for values. If the schema is for an array or object then continued validation is handled by
 * the proxies for those schema types.
 * @param schema
 * @param path
 * @param options
 * @param value
 */
exports.validate = function(schema, path, options, value) {
    if (!schema) schema = {};
    const enforce = options.enforce;
    const valueType = typeof value;
    const schemaType = exports.getSchemaType(schema);

    // validate type
    if (schemaType === 'array') {
        if (!Array.isArray(value)) error('Invalid type: Expected array. Received ' + typeof value, 'TYPE');
    } else if (schemaType && !(valueType === 'number' && schemaType === 'integer') && valueType !== schemaType) {
        error('Invalid type: Expected ' + schemaType + '. Received ' + valueType, 'TYPE');
    } else {
        switch (valueType) {
            case 'function':
            case 'symbol':
            case 'undefined':
                error('Invalid type. Cannot serialize ' + valueType + ' value: ' + value, 'TYPE');
        }
    }

    // enum validation
    if (enforce.enum && Array.isArray(schema.enum)) {
        let found = false;
        const length = schema.enum.length;
        const signed = signature(value);
        for (let i = 0; i < length; i++) {
            if (signed.equal(schema.enum[i])) {
                found = true;
                break;
            }
        }
        if (!found) error('Value ' + value + ' does not match enum ' + schema.enum, 'ENUM');
    }

    // type specific validation
    switch (schemaType) {
        case 'array':
            value = exports.array(schema, path, options, value, false);
            break;

        case 'number':
        case 'integer':

            // validate maximum
            if (enforce.maximum && schema.hasOwnProperty('maximum')) {
                if (schema.exclusiveMaximum && value === schema.maximum) error('Value ' + value + ' over exclusive maximum ' + schema.maximum, 'MAX');
                if (value > schema.maximum) error('Value ' + value + ' over ' + (schema.exclusiveMaximum ? 'exclusive ' : '') + 'maximum ' + schema.maximum, 'NMAX');
            }

            // validate minimum
            if (enforce.minimum && schema.hasOwnProperty('minimum')) {
                if (schema.exclusiveMinimum && value === schema.minimum) error('Value ' + value + ' under exclusive minimum ' + schema.minimum, 'MIN');
                if (value < schema.minimum) error('Value ' + value + ' under ' + (schema.exclusiveMinimum ? 'exclusive ' : '') + 'minimum ' + schema.minimum, 'NMIN');
            }

            // validate multiple of
            if (enforce.multipleOf && schema.hasOwnProperty('multipleOf') && value % schema.multipleOf !== 0) {
                error('Value ' + value + ' not a multiple of ' + schema.multipleOf, 'NMULT');
            }

            // validate integer
            if (schemaType === 'integer' && !Number.isInteger(value)) error('Value ' + value + ' must be an integer.', 'NINT');

            break;

        case 'string':

            // validate max length
            if (enforce.maxLength && schema.hasOwnProperty('maxLength') && value.length > schema.maxLength) {
                error('Value ' + value + ' has length (' + value.length + ') above max length ' + schema.maxLength, 'SMAX');
            }

            // validate min length
            if (enforce.minLength && schema.hasOwnProperty('minLength') && value.length < schema.minLength) {
                error('Value ' + value + ' has length (' + value.length + ') below min length ' + schema.minLength, 'SMIN');
            }

            // validate pattern
            if (enforce.pattern && schema.hasOwnProperty('pattern') && !(new RegExp(schema.pattern)).test(value)) {
                error('Value ' + value + ' does not match pattern ' + schema.pattern, 'SPAT');
            }

            break;

        case 'object':
            value = exports.object(schema, path, options, value, false);
            break;
    }

    return value;
};



function error(message, code) {
    const err = Error(message);
    err.code = 'ESR' + code;
    throw err;
}

function equal(v1, v2) {
    // same value check
    if (v1 === v2) return true;

    // type match check
    const t1 = typeof v1;
    const a1 = Array.isArray(v1);
    if (t1 !== typeof v2 || a1 !== Array.isArray(v2)) return false;

    // check array items
    if (a1) {
        if (v1.length !== v2.length) return false;

        for (let i = 0; i < v1; i++) {
            if (!equal(v1[i], v2[i])) return false;
        }

    // check object properties
    } else {
        const k1 = Object.keys(v1);
        const k2 = Object.keys(v2);

        // could use equal(k1, k2) except without that we can bypass several if statements
        if (k1.length !== k2.length) return false;
        for (let i = 0; i < k1; i++) {
            if (!equal(k1[i], k2[i])) return false;
        }

        for (let i = 0; i < k1.length; i++) {
            const k = k1[i];
            if (!equal(v1[k], v2[k])) return false;
        }
    }

    return true;
}

