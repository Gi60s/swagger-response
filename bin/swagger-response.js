"use strict";

module.exports = SwaggerResponse;

/**
 * Get a managed object that will automatically make sure that you don't set values that you shouldn't.
 * If the response schema is not an object though then this function will throw an error.
 * @param {IncomingMessage} req
 * @param {string, number} [responseCode="default"]
 * @returns {SwaggerResponse}
 * @throws {Error} in case of unexpected structure.
 * @constructor
 */
function SwaggerResponse(req, responseCode) {
    const factory = Object.create(SwaggerResponse.prototype);
    const responses = getPropertyChainValue(req, 'swagger.operation.responses', '');
    responseCode = '' + responseCode;

    // get the schema
    const schema = getPropertyChainValue(responses, responseCode + '.schema', '');

    // validate that the type is not primitive
    const type = getPropertyType(schema);
    if (type !== 'object' && type !== 'array') {
        throw Error('Response object can only be managed if the schema is an array or object.');
    }

    // build the schema object
    if (type === 'object') {
        schemaObject(factory, schema, []);
    } else {
        schemaArray(factory, schema, []);
    }

    return factory;
}

/**
 * Look for property values that are strings and perform variable value substitution. If a
 * string has a "{varName}" in it and the data object has a "varName" property then the
 * value from that property is cast to a string and injected in place of "{varName}".
 * @param {boolean} [recursive=false] Whether to recursively look for strings in sub-objects.
 * @param {object, object[]} obj The object (or objects) to perform substitution on.
 * @param {object} data The data object to use to identify string substitutions and to
 * provide values.
 */
SwaggerResponse.injectParameters = function(recursive, obj, data) {
    const rxs = [];

    Object.keys(data).forEach(function(key) {
        rxs.push({
            rx: new RegExp('\\{' + key + '\\}', 'g'),
            value: data[key]
        });
    });

    return inject(recursive, obj);

    function inject(recursive, obj) {
        const array = Array.isArray(obj) ? obj : [obj];
        array.forEach(function(item) {
            if (item && typeof item === 'object') {
                Object.keys(item).forEach(function(key) {
                    var value = item[key];
                    if (typeof value === 'string') {
                        rxs.forEach(function(rx) {
                            value = value.replace(rx.rx, rx.value);
                        });
                        item[key] = value;
                    } else if (recursive && value && typeof value === 'object') {
                        inject(true, value);
                    }
                });
            }
        });
    }
};

SwaggerResponse.manageable = function(req, responseCode) {
    try {
        responseCode = '' + responseCode;
        const responses = getPropertyChainValue(req, 'swagger.operation.responses', '');
        const schema = getPropertyChainValue(responses, responseCode + '.schema', '');
        const type = getPropertyType(schema);
        return type === 'object' || type === 'array';
    } catch (e) {
        return false;
    }
};



function schemaArray(obj, schema, chain) {
    const prop = schema.items;
    const hasProperties =  prop.hasOwnProperty('properties');
    const type = getPropertyType(prop);
    const store = [];
    const validator = getValidateFunction(schema.items, chain);
    const writeMutators = ['fill', 'push', 'splice', 'unshift'];


    // TODO: add optional proxy support

    getAllProperties(Array.prototype)
        .forEach(function(key) {
            if (!/^_/.test(key) && !~writeMutators.indexOf(key)) {
                obj[key] = function() {
                    return store[key].apply(store, arguments);
                }
            }
        });


    obj.fill = function(value, start, end) {
        if (arguments.length < 2) start = 0;
        if (arguments.length < 3) end = store.length;
        for (var i = start; i < end; i++) obj.set(i, value);
    };

    obj.push = function() {
        for (var i = 0; i < arguments.length; i++) {
            obj.set(store.length, arguments[i]);
        }
    };

    obj.splice = function(start, deleteCount) {
        const args = [ start, deleteCount ];
        var i;
        for (i = 2; i < arguments.length; i++) args.push(null);
        store.splice.apply(store, args);
        for (i = 2; i < arguments.length; i++) {
            var index = start + i - 2;
            obj.set(store[index], arguments[i]);
        }
    };

    obj.unshift = function(args) {
        store.unshift.apply(store, arguments);
        for (var i = 0; i < arguments.length; i++) obj.set(i, arguments[i]);
    };

    obj.get = function(index) {
        return store[index];
    };

    obj.set = function(index, value) {
        // run the validator
        validator(value, '[' + index + ']');

        if (type === 'object' && hasProperties) {
            store[index] = schemaObject({}, schema.items, chain.concat([ index ]));
            Object.keys(value).forEach(function (k) {
                store[index][k] = value[k];
            });
        } else {
            store[index] = value;
        }
    };



    /**
     * Get JSON object representation.
     * @returns {Array}
     */
    obj.toJSON = function() {
        return store.slice(0);
    };

    Object.freeze(obj);
    return obj;
}


function schemaObject(obj, schema, chain) {
    const store = {};

    Object.keys(schema.properties).forEach(function(key) {
        const prop = schema.properties[key];
        const hasProperties =  prop.hasOwnProperty('properties');
        const type = getPropertyType(prop);
        const validator = getValidateFunction(prop, chain.concat([key]));

        Object.defineProperty(obj, key, {
            enumerable: true,
            get: function() {
                return store[key];
            },
            set: function(value) {
                // run the validator
                validator(value);

                if (type === 'object' && hasProperties) {
                    Object.keys(value).forEach(function (k) {
                        obj[key][k] = value[k];
                    });
                } else {
                    store[key] = value;
                }
            }
        });

        if (type === 'array') {
            store[key] = {};
            schemaArray(store[key], prop, chain);
        } else if (type === 'object' && hasProperties) {
            store[key] = {};
            schemaObject(store[key], prop, chain.concat([key]));
        } else {
            store[key] = void 0;
        }

        // set default
        if (prop.hasOwnProperty('default')) obj[key] = prop.default;

    });

    if (schema.hasOwnProperty('properties')) Object.freeze(obj);
    return obj;
}

/**
 * Get all properties for an object, whether own properties, inherited, or non-enumerable.
 * @param obj
 * @returns {string[]}
 */
function getAllProperties(obj){
    const allProps = [];
    var curr = obj;
    do{
        var props = Object.getOwnPropertyNames(curr);
        props.forEach(function(prop){
            if (allProps.indexOf(prop) === -1) allProps.push(prop);
        })
    } while(curr = Object.getPrototypeOf(curr));
    return allProps
}

/**
 * Take an array of strings and numbers and turn it into a property chain equivalent as a string.
 * @param {Array.<string, number>} chain
 * @returns {string}
 */
function getChainValue(chain) {
    return chain
        .reduce(function(result, curr) {
            if (typeof curr === 'number') {
                result += '[' + curr + ']';
            } else {
                result += result.length > 0 ? '.' + curr : curr;
            }
            return result;
        }, '');
}

/**
 * Get the type from the property.
 * @param {object} property
 * @returns {string}
 */
function getPropertyType(property) {
    return property.hasOwnProperty('type') ? property.type : property.hasOwnProperty('properties') ? 'object' : 'undefined';
}

/**
 * Get the property value at the end of a property chain. Using this method throw better
 * errors if they are encountered.
 * @param {object} root
 * @param {string} chain
 * @param {string} pathToRoot
 * @returns {*}
 */
function getPropertyChainValue(root, chain, pathToRoot) {
    const chainAr = chain.split('.');

    var path = pathToRoot;
    var o = root;
    while (chainAr.length) {
        var key = chainAr.shift();
        if (key in o) {
            path += (path.length > 0 ? '.' : '') + key;
            o = o[key];
        } else {
            throw Error('Unexpected object structure. ' + key + ' does not exist ' +
                (path.length > 0 ? ' at ' + path : '') +
                ' in ' + root);
        }
    }

    return o;
}

/**
 * Get a function that will validate the value intended for a property.
 * @param property
 * @param chain
 * @returns {Function}
 */
function getValidateFunction(property, chain) {
    const fullChain = getChainValue(chain);
    const type = getPropertyType(property);
    return function(value, key) {
        if (!key) key = '';
        if (type !== 'undefined' && (
                (type === 'array' && !Array.isArray(value)) ||
                typeof value !== type
            )) throw Error('Invalid type {' + type + '} for ' + fullChain + key);
    };
}