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
const crypto            = loadCrypto();

/**
 * Make a copy of the object in an ordered way so that a consistent has can be produced.
 * @param {*} value
 * @param {boolean} [fastSignature=true] Faster to derive signature but requires more memory.
 * @returns {Signature}
 */
module.exports = function (value, fastSignature) {
    if (arguments.length < 2) fastSignature = true;
    if (value && value.constructor === Signature) return value;
    const encode = value && typeof value === 'object';
    return new Signature(encode, encode ? hash(value, fastSignature) : value);
};

function Signature(encoded, value) {
    Object.defineProperties(this, {
        encoded: { value: encoded },
        value: { value: value }
    });
}

Signature.prototype.equal = function(value) {
    value = module.exports(value);
    return this.encoded === value.encoded && this.value === value.value;
};

/**
 * The hash function attempts to use crypto, otherwise it uses buffers (larger memory footprint)
 * @param {*} value
 * @param {boolean} fast
 * @returns {string}
 */
function hash(value, fast) {
    const map = new Map();
    let str = '';

    function build(value, chain) {
        if (map.has(value)) {
            return map.get(value);

        } else if (Array.isArray(value)) {
            if (value.__swaggerResponseSignature__) return value.__swaggerResponseSignature__;

            let str = '';
            map.set(value, chain);
            value.forEach((item, index) => str += build(item, chain + '/' + index));
            return str;

        } else if (value && typeof value === 'object') {
            if (value.__swaggerResponseSignature__) return value.__swaggerResponseSignature__;

            //const copy = {};
            map.set(value, chain);

            let str = '';
            const keys = Object.keys(value);
            keys.sort();
            keys.forEach(key => str += key + build(value[key], chain + '/' + key));

        } else {
            str += String(value);
        }
    }

    build(value, '#');

    if (fast || !crypto) {
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