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
const Typed     = require('fully-typed');

exports.response = Typed({
    type: Object,
    default: {},
    properties: {
        useDefaults: {
            type: Boolean,
            default: false
        },
        enforce: {
            type: Object,
            default: {},
            properties: {
                // numbers
                multipleOf: {
                    type: Boolean,
                    default: true
                },
                maximum: {
                    type: Boolean,
                    default: true
                },
                minimum: {
                    type: Boolean,
                    default: true
                },

                // strings
                maxLength: {
                    type: Boolean,
                    default: true
                },
                minLength: {
                    type: Boolean,
                    default: false
                },
                pattern: {
                    type: Boolean,
                    default: true
                },

                // arrays
                maxItems: {
                    type: Boolean,
                    default: true
                },
                minItems: {
                    type: Boolean,
                    default: false
                },
                uniqueItems: {
                    type: Boolean,
                    default: false
                },

                // objects
                maxProperties: {
                    type: Boolean,
                    default: true
                },
                minProperties: {
                    type: Boolean,
                    default: true
                },
                required: {
                    type: Boolean,
                    default: true
                },

                // general
                enum: {
                    type: Boolean,
                    default: true
                }
            }
        }
    }
});