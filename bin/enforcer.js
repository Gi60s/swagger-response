'use strict';
const rx                = require('./rx');
const same              = require('./same');

module.exports = function enforcer(schema, options, initial) {
    schema = new PreppedSchema(schema, options);
    if (arguments.length < 3) {
        if (schema.type === 'array') {
            initial = [];
        } else if (schema.type === 'object') {
            initial = {};
        }
    }
    validate(schema, initial);
    return getProxy(schema, initial);
};

/**
 * Create an array with schema enforcement.
 * @param {Object} schema The schema definition.
 * @param {Array} initial The array to initialize from.
 * @returns {*[]}
 */
function arrayProxy(schema, initial) {

    const proxy = new Proxy(initial, {
        get: function(target, property) {
            switch (property) {
                case '__swaggerResponseType__': return 'array';
                case '__swaggerResponseProxyTarget__': return target;

                case 'concat': return function(value) {
                    const ar = target.concat.apply(target, arguments);
                    validateItems(ar, arguments, 0);
                    validateMaxMinArrayLength(schema, ar.length);
                    setItemProxies(arguments, 0);
                    return arrayProxy(schema, ar);
                };

                case 'copyWithin': return function(index, start, end) {
                    target.copyWithin.apply(target, arguments);
                    return proxy;
                };

                case 'fill': return function(value, start, end) {
                    if (schema.items) {
                        validateItem(target, value);
                        arguments[0] = getProxy(schema.items, value);
                    }
                    target.fill.apply(target, arguments);
                    return proxy;
                };

                case 'filter': return function(callback, thisArg) {
                    const ar = target.filter.apply(target, arguments);
                    validate(schema, ar);
                    return arrayProxy(schema, ar);
                };

                case 'map': return function(callback, thisArg) {
                    const ar = target.map.apply(target, arguments);
                    validate(schema, ar);
                    return arrayProxy(schema, ar);
                };

                case 'pop': return function() {
                    validateLength(target - 1);
                    return target.pop();
                };

                case 'push': return function(value) {
                    validateItems(target, arguments, 0);
                    validateLength(target + arguments.length);
                    setItemProxies(arguments, 0);
                    return target.push.apply(target, arguments);
                };

                case 'shift': return function() {
                    validateLength(target - 1);
                    return target.shift();
                };

                case 'slice': return function(begin, end) {
                    const ar = target.slice.apply(target, arguments);
                    validate(schema, ar);
                    return arrayProxy(schema, ar);
                };

                case 'splice': return function(start, deleteCount, item) {
                    const hasDeleteCount = typeof deleteCount === 'number';
                    const index = hasDeleteCount ? 2 : 1;
                    validateItems(target, arguments, index);
                    validateLength(target + arguments.length - index - (hasDeleteCount ? deleteCount : 0));
                    setItemProxies(arguments, index);
                    const ar = target.splice.apply(target, arguments);
                    return arrayProxy(schema, ar);
                };

                case 'unshift': return function() {
                    validateItems(target, arguments, 0);
                    validateLength(target.length + arguments.length);
                    setItemProxies(arguments, 0);
                    return target.unshift.apply(target, arguments);
                };

                default: return target[property];
            }
        },
        set: function(target, property, value) {
            if (rx.integer.test(property)) {
                const index = parseInt(property);
                if (index > target.length) validateLength(index);
                validateItem(target, value);
                target[property] = schema.items ? getProxy(schema.items, value) : value;
            } else {
                target[property] = value;
            }
            return true;
        }
    });

    return proxy;

    function setItemProxies(args, start) {
        if (schema.items) {
            const length = args.length;
            for (let i = start; i < length; i++) args[i] = getProxy(schema.items, args[i]);
        }
    }

    function validateLength(length) {
        validateMaxMinArrayLength(schema, length);
    }

    function validateItem(target, value) {
        if (schema.items) validate(schema.items, value);
        validateUniqueItem(schema, target, value);
    }

    function validateItems(target, args, start) {
        const length = args.length;
        for (let i = start; i < length; i++) validateItem(target, args[i]);
    }
}

/**
 * Create an object with schema enforcement.
 * @param {object} schema The schema definition.
 * @param {Object} initial The initial value.
 * @returns {object}
 */
function objectProxy(schema, initial) {
    return new Proxy(initial, {
        deleteProperty: function(target, property) {
            validateLength(target, property, false);
            if (schema.properties.hasOwnProperty(property) && schema.properties[property].required) {
                error('Cannot delete required property: ' + property, 'REQ');
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

            if (schema.properties && schema.properties[property]) {
                const subSchema = schema.properties[property];
                validateLength(target, property, true);
                validate(subSchema, value);
                target[property] = getProxy(subSchema, value);

            } else if (schema.additionalProperties) {
                validateLength(target, property, true);
                validate(schema.additionalProperties, value);
                target[property] = getProxy(schema.additionalProperties, value);

            } else {
                error('Property not allowed: ' + property);
            }

            return true;
        }
    });

    function validateLength(target, property, adding) {
        const hasProperty = target.hasOwnProperty(property);
        const length = Object.keys(schema.properties).length;
        if (adding && !hasProperty) {
            validateMaxMinPropertiesLength(schema, length + 1);
        } else if (!adding && hasProperty) {
            validateMaxMinPropertiesLength(schema, length - 1);
        }
    }
}


/**
 * Get a deep proxy for a value.
 * @param {object} schema
 * @param {*} value
 * @returns {*}
 */
function getProxy(schema, value) {
    if (schema.type === 'array') {
        if (schema.items) {
            const length = value.length;
            for (let i = 0; i < length; i++) value[i] = getProxy(schema.items, value[i]);
        }
        return arrayProxy(schema, value);
    } else if (schema.type === 'object') {
        const specifics = schema.properties || {};
        Object.keys(value)
            .forEach(key => {
                const useSchema = specifics[key] || schema.additionalProperties || null;
                if (useSchema) value[key] = getProxy(useSchema, value[key]);
            });
        return objectProxy(schema, value);
    } else {
        return value;
    }
}

/**
 * Throw an error if any errors are found.
 * @param schema
 * @param value
 */
function validate(schema, value) {
    const valueType = typeof value;

    // validate that the value is serializable
    validateSerializable(value);

    // if no schema then we're done validating-
    if (!schema) return;

    // array validation
    if (schema.type === 'array') {

        // validate type
        if (!Array.isArray(value)) error('Invalid type: Expected an array. Received: ' + valueType, 'TYPE');

        // validate max items and min items
        validateMaxMinArrayLength(schema, value.length);

        // validate unique items
        validateUniqueItems(schema, [], value);

        // validate each item in the value
        const length = value.length;
        for (let i = 0; i < length; i++) validate(schema.items, value[i]);

    // object validation
    } else if (schema.type === 'object') {

        // validate type
        if (!value || valueType !== 'object' || Array.isArray(value)) error('Invalid type: Expected a non null object. Received: ' + value, 'TYPE');

        const length = schema.allOf.length;
        const valueProperties = Object.keys(value);
        const valuePropertiesLength = valueProperties.length;

        // validate serializable per property
        for (let i = 0; i < length; i++) validateSerializable(value[valueProperties[i]]);

        // validate all schemas
        const allOfLength = schema.allOf.length;
        for (let i = 0; i < allOfLength; i++) {
            const sub = schema.allOf[i];
            const definedProperties = sub.properties ? Object.keys(sub.properties) : [];

            validateMaxMinPropertiesLength(sub, valuePropertiesLength);

            if (sub.properties) {
                const propertiesLength = definedProperties.length;
                for (let j = 0; j < propertiesLength; j++) {
                    const property = definedProperties[j];
                    const propertySchema = sub.properties[property];
                    const valueHasProperty = value.hasOwnProperty(property);

                    if (propertySchema.required && !valueHasProperty) {
                        error('Missing required property: ' + property, 'REQ');
                    }

                    if (valueHasProperty) validate(propertySchema, value[property]);
                }
            }

            if (sub.additionalProperties) {
                for (let j = 0; j < valuePropertiesLength; j++) {
                    const property = valueProperties[j];
                    if (!sub.properties || !sub.properties.hasOwnProperty(property)) validate(sub.additionalProperties, value[property]);
                }

            } else if (sub.properties) {
                const unknownProperties = valueProperties.filter(property => definedProperties.indexOf(property) === -1);
                if (unknownProperties.length > 0) {
                    error('Propert' + (unknownProperties.length > 1 ? 'ies' : 'y') + ' not allowed: ' + unknownProperties.join(', '), 'NPER');
                }
            }

        }

    } else if (schema.type === 'number' || schema.type === 'integer') {

        // validate type
        if (valueType !== 'number' || isNaN(value)) error('Invalid type: Expected a number or an integer. Received: ' + valueType, 'TYPE');

        // validate maximum
        if (schema.hasOwnProperty('maximum')) {
            if (schema.exclusiveMaximum && value === schema.maximum) error('Value ' + value + ' over exclusive maximum ' + schema.maximum, 'MAX');
            if (value > schema.maximum) error('Value ' + value + ' over ' + (schema.exclusiveMaximum ? 'exclusive ' : '') + 'maximum ' + schema.maximum, 'NMAX');
        }

        // validate minimum
        if (schema.hasOwnProperty('minimum')) {
            if (schema.exclusiveMinimum && value === schema.minimum) error('Value ' + value + ' under exclusive minimum ' + schema.minimum, 'MIN');
            if (value < schema.minimum) error('Value ' + value + ' under ' + (schema.exclusiveMinimum ? 'exclusive ' : '') + 'minimum ' + schema.minimum, 'NMIN');
        }

        // validate multiple of
        if (schema.hasOwnProperty('multipleOf') && value % schema.multipleOf !== 0) {
            error('Value ' + value + ' not a multiple of ' + schema.multipleOf, 'NMULT');
        }

        // validate integer
        if (schema.type === 'integer' && !Number.isInteger(value)) error('Value ' + value + ' must be an integer.', 'NINT');

    } else if (schema.type === 'string') {

        // validate type
        if (valueType !== 'string') error('Invalid type: Expected a string. Received: ' + valueType, 'TYPE');

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
        if (!found) error('Value ' + value + ' does not match enum options: ' + JSON.stringify(schema.enum, null, 2), 'ENUM');
    }
}

function validateMaxMinArrayLength(schema, length) {

    // validate max items
    if (schema.hasOwnProperty('maxItems') && length > schema.maxItems) error('Array length is greater than allowable maximum length', 'LEN');

    // validate min items
    if (schema.hasOwnProperty('minItems') && length < schema.maxItems) error('Array length is less than allowable minimum length', 'LEN');
}

function validateMaxMinPropertiesLength(schema, length) {
    if (schema.hasOwnProperty('maxProperties') && length > schema.maxProperties) {
        error('The object has more properties than the allowed maximum: ' + schema.maxProperties);
    }

    if (schema.hasOwnProperty('minProperties') && length < schema.minProperties) {
        error('The object has fewer properties than the allowed minimum: ' + schema.minProperties);
    }
}

function validateSerializable(value) {
    const type = typeof value;

    // non-serializable types
    switch (type) {
        case 'function':
        case 'symbol':
        case 'undefined':
            error('Invalid type. Value type cannot be serialized to JSON string: ' + type, 'TYPE')
    }
}

function validateUniqueItem(schema, array, item) {
    if (schema.uniqueItems && array.find(x => same(x, item))) {
        error('Array requires that all items be unique. Value is a duplicate: ' + item, 'UNIQ');
    }
}

function validateUniqueItems(schema, array, items) {
    if (schema.uniqueItems) {
        const length = items.length;
        for (let i = 0; i < length; i++) validateUniqueItem(schema, array, items[i]);
    }
}




function error(message, code) {
    const err = Error('Error: ' + message);
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
            schema.propertyKeys = schema.properties ? Object.keys(schema.properties) : [];

            // convert any defined properties to prepped schemas
            schema.propertyKeys.forEach(key => {
                schema.properties[key] = new PreppedSchema(schema.properties[key], options);
            });

            // look for additionalProperties
            if (schema.additionalProperties) schema.additionalProperties = new PreppedSchema(schema.additionalProperties, options);

        });
    }
}
