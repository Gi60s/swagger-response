/**
 *  @license
 *    Copyright 2016 Brigham Young University
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 **/
'use strict';
'use strict';
const crypto            = loadCrypto();

/**
 * Make a copy of the object in an ordered way so that a consistent has can be produced.
 * @param {*} value
 * @param {object} [options]
 * @returns {Signature}
 */
module.exports = function (value, options) {
    return new Signature(value, options);
};

function Signature(value, options) {
    if (value && value.constructor === Signature) return value;
    const encode = value && typeof value === 'object';
    Object.defineProperties(this, {
        encoded: { value: encode },
        options: { value: options },
        value: { value: encode ? hash(value, options) : value }
    });
}

Signature.prototype.equal = function(value) {
    value = module.exports(value, this.options);
    return this.encoded === value.encoded && this.value === value.value;
};

Signature.prototype.toString = function() {
    return (this.encoded ? '1' : '0') + this.value;
};

/**
 * The hash function attempts to use crypto, otherwise it uses buffers (larger memory footprint)
 * @param {*} value
 * @param {object} [options]
 * @returns {string}
 */
function hash(value, options) {
    if (!options || typeof options !== 'object') options = {};
    if (!options.hasOwnProperty('fast')) options.fast = true;
    if (!options.hasOwnProperty('recursive')) options.recursive = false;

    const map = options.recursive ? new Map() : { set: noop, has: noop };
    let str = '';

    function build(value, chain) {
        const type = typeof value;

        if (map.has(value)) {
            str += '\u001A' + map.get(value) + '\u001B';

        } else if (Array.isArray(value)) {
            const length = value.length;

            map.set(value, chain);
            str += '[';
            for (let i = 0; i < length; i++) {
                str += ',' + build(value[i], chain + '/' + i);
            }
            str += ']';

        } else if (value && type === 'object') {
            map.set(value, chain);
            str += '{';
            const keys = Object.keys(value);
            keys.sort();
            const length = keys.length;
            for (let i = 0; i < length; i++) {
                const key = keys[i];
                str += ',' + key + ':' + build(value[key], chain + '/' + key)
            }
            str += '}';

        } else if (type === 'string') {
            str += '\u0002' + value + '\u0003'
        } else {
            str += String(value);
        }
    }

    build(value, '#');

    if (options.fast || !crypto) {
        return str;
    } else {
        const hash = crypto.createHash('sha256');
        hash.update(value);
        return hash.digest('latin1');
    }
}

function loadCrypto() {
    try {
        return require('crypto');
    } catch (e) {
        return null;
    }
}

function noop() {}