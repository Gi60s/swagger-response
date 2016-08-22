/**
 * Do a deep equal on two values.
 * @param {*} v1
 * @param {*} v2
 * @returns {boolean} True if deep equal.
 */
exports.equal = function(v1, v2) {
    var i;
    var k;
    if (v1 === v2) {
        return true;
    } else if (Array.isArray(v1) && Array.isArray(v2)) {
        if (v1.length !== v2.length) return false;
        for (i = 0; i < v1.length; i++) {
            if (!valuesAreEqual(v1[i], v2[i])) return false;
        }
        return true;
    } else if (typeof v1 === 'object' && typeof v2 === 'object') {
        const v1Keys = Object.keys(v1);
        const v2Keys = Object.keys(v2);
        if (v1Keys.length !== v2Keys.length) return false;
        for (i = 0; i < v1Keys.length; i++) {
            k = v1Keys[i];
            if (!v2.hasOwnProperty(k)) return false;
            if (!valuesAreEqual(v1[k], v2[k])) return false;
        }
        return true;
    } else {
        return false;
    }
};

/**
 * Get all properties for an object, whether own properties, inherited, or non-enumerable.
 * @param obj
 * @returns {string[]}
 */
exports.getAllProperties = function(obj){
    const allProps = [];
    var curr = obj;
    do{
        var props = Object.getOwnPropertyNames(curr);
        props.forEach(function(prop){
            if (allProps.indexOf(prop) === -1) allProps.push(prop);
        })
    } while(curr = Object.getPrototypeOf(curr));
    return allProps
};

/**
 * Take an array of strings and numbers and turn it into a property chain equivalent as a string.
 * @param {Array.<string, number>} chain
 * @returns {string}
 */
exports.getChainValue = function(chain) {
    return chain
        .reduce(function(result, curr) {
            if (typeof curr === 'number') {
                result += '[' + curr + ']';
            } else {
                result += result.length > 0 ? '.' + curr : curr;
            }
            return result;
        }, '');
};

/**
 * Get the type from the property.
 * @param {object} property
 * @returns {string}
 */
exports.getPropertyType = function(property) {
    return property.hasOwnProperty('type') ? property.type : property.hasOwnProperty('properties') ? 'object' : 'undefined';
};

/**
 * Get the property value at the end of a property chain. Using this method throw better
 * errors if they are encountered.
 * @param {object} root
 * @param {string} chain
 * @param {string} pathToRoot
 * @returns {*}
 */
exports.getPropertyChainValue = function(root, chain, pathToRoot) {
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
};

/**
 * Get a function that will validate the value intended for a property.
 * @param property
 * @param chain
 * @returns {Function}
 */
exports.getValidateFunction = function(property, chain) {
    const fullChain = exports.getChainValue(chain);
    const type = exports.getPropertyType(property);

    function validate(value) {
        var i;
        var found;

        // validate type
        if (type === 'array' && !Array.isArray(value)) return 'Invalid type';
        if (typeof value !== type) return 'Invalid type';

        // validate number value
        if (type === 'number') {

            // validate maximum
            if (property.hasOwnProperty('maximum')) {
                if (property.exclusiveMaximum && value === property.maximum) return 'Value ' + value + ' over exclusive maximum ' + property.maximum;
                if (value > property.maximum) return 'Value ' + value + ' over ' + (property.exclusiveMaximum ? 'exclusive ' : '') + 'maximum ' + property.maximum;
            }

            // validate minimum
            if (property.hasOwnProperty('minimum')) {
                if (property.exclusiveMinimum && value === property.minimum) return 'Value ' + value + ' under exclusive minimum ' + property.minimum;
                if (value < property.minimum) return 'Value ' + value + ' under ' + (property.exclusiveMinimum ? 'exclusive ' : '') + 'minimum ' + property.minimum;
            }

            // validate multiple of
            if (property.hasOwnProperty('multipleOf') && value % property.multipleOf !== 0) return 'Value ' + value + ' not a multiple of ' + property.multipleOf;

        }

        // validate string value
        if (type === 'string') {

            // validate max length
            if (property.hasOwnProperty('maxLength') && value.length > property.maxLength) return 'Value ' + value + ' has length (' + value.length + ') above max length ' + property.maxLength;

            // validate min length
            if (property.hasOwnProperty('minLength') && value.length < property.minLength) return 'Value ' + value + ' has length (' + value.length + ') below min length ' + property.minLength;

            // validate pattern
            if (property.hasOwnProperty('pattern') && !(new RegExp(property.pattern)).test(value)) return 'Value ' + value + ' does not match pattern ' + property.pattern;
        }

        // enum validation
        /*if (Array.isArray(property.enum)) {
         found = false;
         for (i = 0; i < property.enum.length; i++) {
         if (valuesAreEqual(value, property.enum[i])) {
         found = true;
         break;
         }
         }
         if (!found) return 'Value ' + value + ' does not match enum ' + property.enum;
         }*/
    }

    return function(value, key) {
        var error = validate(value);
        if (!key) key = '';
        if (error) throw Error('Invalid value for ' + fullChain + key + ': ' + error);
    };
};

/**
 * Check to see if the current version of node supports proxies.
 * @returns {boolean}
 */
exports.supportsProxies = function() {
    const match = /^v(\d+)\.(\d+)\.(\d+)$/.exec(process.version);
    if (!match) return false;

    const major = parseInt(match[1]);
    if (major >= 6) return true;
};