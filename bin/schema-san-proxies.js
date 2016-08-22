'use strict';
const helper        = require('./helper');

/**
 * Get an array that adheres to the schema specifications.
 * @param {object} schema
 * @param {string[]} chain
 * @returns {prototype}
 */
exports.array = function(schema, chain) {
    const prop = schema.items;
    const hasProperties =  prop.hasOwnProperty('properties');
    const prototype = {};
    const store = [];
    const type = helper.getPropertyType(prop);
    const validator = helper.getValidateFunction(schema.items, chain);
    const writeMutations = ['fill', 'push', 'splice', 'unshift'];
    var prevLength = 0;

    function updateIndexGetSet() {
        var i;
        if (prevLength <= store.length) {
            for (i = prevLength; i <= store.length; i++) {
                (function(index) {
                    Object.defineProperty(obj, index, {
                        enumerable: true,
                        configurable: true,
                        get: function () {
                            return obj.get(index);
                        },
                        set: function (value) {
                            return obj.set(index, value);
                        }
                    });
                })(i);
            }
        } else {
            for (i = prevLength; i > store.length; i--) {
                (function(index) {
                    Object.defineProperty(obj, index, {
                        enumerable: false,
                        configurable: true,
                        get: function() {
                            return void 0;
                        }
                    });
                })(i);
            }
        }
        prevLength = store.length;
    }

    // make all array functions callable through this object.
    helper.getAllProperties(Array.prototype)
        .forEach(function(key) {
            if (!/^_/.test(key) && !~writeMutations.indexOf(key) && typeof Array.prototype[key] === 'function') {
                prototype[key] = function() {
                    return store[key].apply(store, arguments);
                };
            }
        });

    // define length property
    Object.defineProperty(prototype, 'length', {
        get: function() {
            return store.length;
        }
    });

    // define the fill function
    prototype.fill = function(value, start, end) {
        if (arguments.length < 2) start = 0;
        if (arguments.length < 3) end = store.length;
        for (var i = start; i < end; i++) obj.set(i, value);
    };

    // define the push function
    prototype.push = function() {
        for (var i = 0; i < arguments.length; i++) {
            obj.set(store.length, arguments[i]);
        }
    };

    // define the splice function
    prototype.splice = function(start, deleteCount) {
        const args = [ start, deleteCount ];
        var i;
        for (i = 2; i < arguments.length; i++) args.push(null);
        store.splice.apply(store, args);
        for (i = 2; i < arguments.length; i++) {
            var index = start + i - 2;
            obj.set(store[index], arguments[i]);
        }
    };

    // define the unshift property
    prototype.unshift = function (args) {
        store.unshift.apply(store, arguments);
        for (var i = 0; i < arguments.length; i++) obj.set(i, arguments[i]);
    };

    // define the get function
    prototype.get = function(index) {
        return store[index];
    };

    // define the set function
    prototype.set = function(index, value) {
        // run the validator
        validator(value, '[' + index + ']');

        if (type === 'object' && hasProperties) {
            store[index] = exports.object(schema.items, chain.concat([ index ]));
            Object.keys(value).forEach(function (k) {
                store[index][k] = value[k];
            });
        } else {
            store[index] = value;
        }

        updateIndexGetSet();
    };

    /**
     * Get JSON object representation.
     * @returns {Array}
     */
    prototype.toJSON = function() {
        return store.slice(0);
    };

    const obj = Object.create(prototype);
    updateIndexGetSet();
    return obj;
};

exports.object = function (schema, chain) {
    const obj = {};
    const store = {};

    Object.keys(schema.properties).forEach(function(key) {
        const prop = schema.properties[key];
        const hasProperties =  prop.hasOwnProperty('properties');
        const type = helper.getPropertyType(prop);
        const validator = helper.getValidateFunction(prop, chain.concat([key]));

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
            store[key] = exports.array(prop, chain);
        } else if (type === 'object' && hasProperties) {
            store[key] = exports.object(prop, chain.concat([key]));
        } else {
            store[key] = void 0;
        }

        // set default
        if (prop.hasOwnProperty('default')) obj[key] = prop.default;

    });

    if (schema.hasOwnProperty('properties')) Object.freeze(obj);
    return obj;
};