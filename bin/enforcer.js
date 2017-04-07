'use strict';
const rx                = require('./rx');
const same              = require('./same');

module.exports = function enforcer(schema, options, initial) {
    schema = new PreppedSchema(schema, options);

    // validate and where possible proxy
    if (schema.type === 'array') {
        if (arguments.length < 3) initial = [];
        validate(schema, '', initial);
        return arrayProxy(schema, '', initial);
    } else if (schema.type === 'object') {
        if (arguments.length < 3) initial = {};
        validate(schema, '', initial);
        return objectProxy(schema, '', initial);
    } else if (arguments.length >= 3) {
        return validate(schema, '', initial);
    }
};

/**
 * Create an array with schema enforcement.
 * @param {Object} schema The schema definition.
 * @param {string} path The path to this value.
 * @param {Array} initial The array to initialize from.
 * @returns {*[]}
 */
function arrayProxy(schema, path, initial) {

    const proxy = new Proxy(initial, {
        get: function(target, property) {
            switch (property) {
                case '__swaggerResponseType__': return 'array';

                case 'concat': return function(value) {
                    validateValues(arguments, 0, 0);
                    const ar = target.concat.apply(target, arguments);
                    validate(schema, '', ar);
                    return arrayProxy(schema, '', ar);
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
                    validate(schema, '', ar);
                    return arrayProxy(schema, '', ar);
                };

                case 'map': return function(callback, thisArg) {
                    const ar = target.map.apply(target, arguments);
                    validate(schema, '', ar);
                    return arrayProxy(schema, '', ar);
                };

                case 'pop': return function() {
                    validateLength(target - 1);
                    return target.pop();
                };

                case 'push': return function(value) {
                    validateValues(arguments, 0, target.length);
                    validateLength(target + arguments.length);
                    return target.push.apply(target, arguments);
                };

                case 'shift': return function() {
                    validateLength(target - 1);
                    return target.shift();
                };

                case 'slice': return function(begin, end) {
                    const ar = target.slice.apply(target, arguments);
                    validate(schema, '', ar);
                    return arrayProxy(schema, '', ar);
                };

                case 'splice': return function(start, deleteCount, item) {
                    const hasDeleteCount = typeof deleteCount === 'number';
                    const index = hasDeleteCount ? 2 : 1;
                    validateValues(arguments, index, start);
                    validateLength(target + arguments.length - index - (hasDeleteCount ? deleteCount : 0));
                    const ar = target.splice.apply(target, arguments);
                    return arrayProxy(schema, '', ar);
                };

                case 'unshift': return function() {
                    validateValues(arguments, 0, 0);
                    validateLength(target + arguments.length);
                    return target.unshift.apply(target, arguments);
                };

                default: return target[property];
            }
        },
        set: function(target, property, value) {
            if (rx.integer.test(property)) {
                const index = parseInt(property);
                if (index > target.length) validateLength(index);
                validateItem(target, property, value);
            } else {
                target[property] = value;
            }
            return true;
        }
    });

    return proxy;

    function validateLength(length) {
        validateMaxMinArrayLength(schema, path, length);
    }

    function validateItem(target, property, value) {
        const fullPath = path + '/' + property;
        if (schema.items) validate(schema.items, fullPath, value);
        validateUniqueItems(schema, path, target, value);
        setTargetValue(schema.items, fullPath, target, property, value, true);
    }

    function validateValues(args, start, index) {
        for (let i = start; i < args.length; i++) args[i] = validateItem(args[i], start + index);
    }
}

/**
 * Create an object with schema enforcement.
 * @param {object} schema The schema definition.
 * @param {string} path Position within the map data.
 * @param {Object} initial The initial value.
 * @returns {object}
 */
function objectProxy(schema, path, initial) {
    return new Proxy(initial, {
        deleteProperty: function(target, property) {
            validateLength(target, property, false);
            if (schema.properties.hasOwnProperty(property) && schema.properties[property].required) {
                error(path, 'Cannot delete required property: ' + property, 'REQ');
            }
            delete target[property];
            return true;
        },
        get: function(target, property) {
            switch (property) {
                case '__swaggerResponseSignature__': return null;
                default: return target[property];
            }
        },
        set: function(target, property, value) {
            const fullPath = path + '/' + property;

            if (schema.properties && schema.properties[property]) {
                validateLength(target, property, true);
                setTargetValue(schema.properties[property], fullPath, target, property, value, true);

            } else if (schema.additionalProperties) {
                validateLength(target, property, true);
                setTargetValue(schema.additionalProperties, fullPath, target, property, value, true);

            } else {
                error(path, 'Property not allowed: ' + property);
            }

            return true;
        }
    });

    function validateLength(target, property, adding) {
        const hasProperty = target.hasOwnProperty(property);
        const length = Object.keys(schema.properties).length;
        if (adding && !hasProperty) {
            validateMaxMinPropertiesLength(schema, path, length + 1);
        } else if (!adding && hasProperty) {
            validateMaxMinPropertiesLength(schema, path, length - 1);
        }
    }
}

/**
 * Set an objects property to a potentially proxied value
 * @param {object} schema
 * @param {string} path
 * @param {object} target
 * @param {string} property
 * @param {*} value
 * @param {boolean} needsValidation
 */
function setTargetValue(schema, path, target, property, value, needsValidation) {
    if (needsValidation) validate(schema, path, value);
    if (schema.type === 'array') {
        target[property] = arrayProxy(schema, path, value);
    } else if (schema.type === 'object') {
        target[property] = objectProxy(schema, path, value);
    } else {
        target[property] = value;
    }
}

/**
 * Throw an error if any errors are found.
 * @param schema
 * @param path
 * @param value
 */
function validate(schema, path, value) {
    const valueType = typeof value;

    // array validation
    if (schema.type === 'array') {

        // validate type
        if (!Array.isArray(value)) error(path, 'Invalid type: Expected an array. Received: ' + valueType, 'TYPE');

        // validate max items and min items
        validateMaxMinArrayLength(schema, path, value.length);

        // validate unique items
        validateUniqueItems(schema, path, [], value);

        // validate each item in the value
        if (schema.items) {
            const length = value.length;
            for (let i = 0; i < length; i++) {
                validate(schema.items, path + '/' + i, value[i]);
            }
        }

    // object validation
    } else if (schema.type === 'object') {

        // validate type
        if (!value || valueType !== 'object') error(path, 'Invalid type: Expected a non null object. Received: ' + value, 'TYPE');

        const length = schema.allOf.length;
        const valueProperties = Object.keys(value);
        const valuePropertiesLength = valueProperties.length;
        for (let i = 0; i < length; i++) {
            const sub = schema.allOf[i];

            validateMaxMinPropertiesLength(sub, path, valuePropertiesLength);

            if (sub.properties) {
                const properties = Object.keys(sub.properties);
                const propertiesLength = properties.length;
                for (let j = 0; j < propertiesLength; j++) {
                    const property = properties[j];
                    const propertySchema = sub.properties[property];
                    const valueHasProperty = value.hasOwnProperty(property);

                    if (propertySchema.required && !valueHasProperty) {
                        error(path + '/' + property, 'Missing required property: ' + property, 'REQ');
                    }

                    if (valueHasProperty) validate(propertySchema, path + '/' + property, value[property]);
                }
            }

            if (sub.additionalProperties) {
                for (let j = 0; j < valuePropertiesLength; j++) {
                    const property = valueProperties[j];
                    if (!sub.properties || !sub.properties.hasOwnProperty(property)) validate(sub.additionalProperties, path + '/' + property, value[property]);
                }
            }
        }

    } else if (schema.type === 'number' || schema.type === 'integer') {

        // validate type
        if (valueType !== 'number' || isNaN(value)) error(path, 'Invalid type: Expected a number or an integer. Received: ' + valueType, 'TYPE');

        // validate maximum
        if (schema.hasOwnProperty('maximum')) {
            if (schema.exclusiveMaximum && value === schema.maximum) error(path, 'Value ' + value + ' over exclusive maximum ' + schema.maximum, 'MAX');
            if (value > schema.maximum) error(path, 'Value ' + value + ' over ' + (schema.exclusiveMaximum ? 'exclusive ' : '') + 'maximum ' + schema.maximum, 'NMAX');
        }

        // validate minimum
        if (schema.hasOwnProperty('minimum')) {
            if (schema.exclusiveMinimum && value === schema.minimum) error(path, 'Value ' + value + ' under exclusive minimum ' + schema.minimum, 'MIN');
            if (value < schema.minimum) error(path, 'Value ' + value + ' under ' + (schema.exclusiveMinimum ? 'exclusive ' : '') + 'minimum ' + schema.minimum, 'NMIN');
        }

        // validate multiple of
        if (schema.hasOwnProperty('multipleOf') && value % schema.multipleOf !== 0) {
            error(path, 'Value ' + value + ' not a multiple of ' + schema.multipleOf, 'NMULT');
        }

        // validate integer
        if (schema.type === 'integer' && !Number.isInteger(value)) error(path, 'Value ' + value + ' must be an integer.', 'NINT');

    } else if (schema.type === 'string') {

        // validate type
        if (valueType !== 'string') error(path, 'Invalid type: Expected a string. Received: ' + valueType, 'TYPE');

        // validate max length
        if (schema.hasOwnProperty('maxLength') && value.length > schema.maxLength) {
            error('Value ' + value + ' has length (' + value.length + ') above max length ' + schema.maxLength, 'SMAX');
        }

        // validate min length
        if (schema.hasOwnProperty('minLength') && value.length < schema.minLength) {
            error('Value ' + value + ' has length (' + value.length + ') below min length ' + schema.minLength, 'SMIN');
        }

        // validate pattern
        if (schema.hasOwnProperty('pattern') && !(new RegExp(schema.pattern)).test(value)) {
            error('Value ' + value + ' does not match pattern ' + schema.pattern, 'SPAT');
        }
    }

    // enum validation
    if (schema.enum) {
        let found = false;
        const length = schema.enum.length;
        for (let i = 0; i < length; i++) {
            if (same(schema.enum[i], value)) {
                found = true;
                break;
            }
        }
        if (!found) error(path, 'Value ' + value + ' does not match enum options: ' + JSON.stringify(schema.enum, null, 2), 'ENUM');
    }
}

function validateMaxMinArrayLength(schema, path, length) {

    // validate max items
    if (schema.hasOwnProperty('maxItems') && length > schema.maxItems) error(path, 'Array length is greater than allowable maximum length', 'LEN');

    // validate min items
    if (schema.hasOwnProperty('minItems') && length < schema.maxItems) error(path, 'Array length is less than allowable minimum length', 'LEN');
}

function validateMaxMinPropertiesLength(schema, path, length) {
    if (schema.hasOwnProperty('maxProperties') && length > schema.maxProperties) {
        error(path, 'The object has more properties than the allowed maximum: ' + schema.maxProperties);
    }

    if (schema.hasOwnProperty('minProperties') && length < schema.minProperties) {
        error(path, 'The object has fewer properties than the allowed minimum: ' + schema.minProperties);
    }
}

function validateUniqueItems(schema, path, array, items) {
    if (schema.uniqueItems) {
        const length = items.length;
        for (let i = 0; i < length; i++) {
            if (array.find((x, idx) => same(x, items[i]))) error(path, 'Array requires that all items be unique. Duplicates at indexes: ' + idx + ', ' + i, 'UNIQ')
        }
    }
}




function error(path, message, code) {
    const err = Error('Error at ' + path + ': ' + message);
    err.code = 'ESR' + code;
    throw err;
}

function getSchemaType(schema) {
    if (!schema) return undefined;
    if (schema.type) return schema.type;
    if (schema.items) return 'array';
    if (schema.properties) return 'object';
    return undefined;
}

function PreppedSchema(schema, options) {
    if (schema && schema.constructor === PreppedSchema) return schema;
    const enforce = options.enforce;
    const prepped = this;

    // copy schema properties
    Object.assign(this, schema);

    // update type
    this.type = getSchemaType(schema);

    // delete unenforced properties from the schema
    [
        'enum',
        'multipleOf', 'maximum', 'minimum',
        'maxLength', 'minLength', 'pattern',
        'maxItems', 'minItems', 'uniqueItems',
        'additionalProperties', 'maxProperties', 'minProperties', 'required'
    ].forEach(key => {
        if (!enforce[key] || !prepped.hasOwnProperty(key)) delete prepped[key]
    });

    if (this.type === 'array') {

        // if array items have a schema then prep that too
        if (Array.isArray(this.items)) this.items = new PreppedSchema(this.items, options);
    }

    if (this.type === 'object') {

        if (!Array.isArray(this.allOf)) this.allOf = [ this ];

        this.allOf.forEach(schema => {

            // get property keys if any
            if (schema.properties) schema.propertyKeys = Object.keys(schema.properties);

            // convert any defined properties to prepped schemas
            schema.propertyKeys.forEach(key => {
                schema.properties[key] = new PreppedSchema(schema.properties[key], options);
            });

            // look for additionalProperties
            if (schema.additionalProperties) schema.additionalProperties = new PreppedSchema(schema.additionalProperties, options);

        });
    }
}
