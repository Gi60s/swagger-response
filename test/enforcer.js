'use strict';
const expect        = require('chai').expect;
const enforce       = require('../bin/enforcer');
const schemas       = require('../bin/schemas');

describe('enforcer', () => {

    describe('array', () => {
        const options = schemas.response.normalize({});
        const schema = {
            type: 'array',
            items: {
                type: 'number'
            }
        };

        it('no initial value', () => {
            const schema = { type: 'array' };
            expect(() => enforce(schema, options)).not.to.throw(Error);
        });

        describe('schemaless items', () => {
            const schema = { type: 'array' };

            it('mixed', () => {
                expect(() => enforce(schema, options, ['a', true, 1, null])).not.to.throw(Error);
            });

        });

        describe('initialize to value', () => {

            it('valid', () => {
                expect(() => enforce(schema, options, [1, 2, 3])).not.to.throw(Error);
            });

            it('not an array', () => {
                expect(code(() => enforce(schema, options, {}))).to.equal('ESRTYPE');
            });

            it('invalid items', () => {
                const c = code(() => enforce(schema, options, ['1']));
                expect(c).to.equal('ESRTYPE');
            });

        });

        it('set property', () => {
            const ar = enforce(schema, options, []);
            ar.foo = 'bar';
            expect(ar.foo).to.equal('bar');
        });

        describe('set by index', () => {

            it('valid', () => {
                const ar = enforce(schema, options, []);
                ar[0] = 1;
                expect(ar[0]).to.equal(1);
            });

            it('invalid', () => {
                const ar = enforce(schema, options, []);
                expect(code(() => ar[0] = '1')).to.equal('ESRTYPE');
            });

            it('valid past current length', () => {
                const ar = enforce(schema, options, []);
                ar[1] = 1;
                expect(ar[1]).to.equal(1);
            });

            it('invalid past max length', () => {
                const schema = { type: 'array', maxItems: 1 };
                const ar = enforce(schema, options, []);
                expect(code(() => ar[1] = 1)).to.equal('ESRLEN');
            });

            it('schemaless items', () => {
                const schema = { type: 'array' };
                const ar = enforce(schema, options, []);
                ar[0] = 1;
                expect(ar[0]).to.equal(1);
            });

        });

        describe('concat', () => {

            it('valid', () => {
                const ar = enforce(schema, options, []);
                const ar2 = ar.concat(1);
                expect(ar2[0]).to.equal(1);
            });

            it('invalid', () => {
                const ar = enforce(schema, options, []);
                expect(code(() => ar.concat('1'))).to.equal('ESRTYPE');
            });

            it('returns new proxy', () => {
                const ar = enforce(schema, options, []);
                const ar2 = ar.concat(1);
                expect(ar2).not.to.equal(ar);
                expect(ar2.__swaggerResponseType__).to.equal('array');
            });

        });

        describe('copyWithin', () => {

            it('makes copy within', () => {
                const ar = enforce(schema, options, [1, 2, 3, 4]);
                ar.copyWithin(2, 0);
                expect(ar).to.deep.equal([1, 2, 1, 2]);
            });

            it('returns original proxy', () => {
                const ar = enforce(schema, options, [1, 2, 3, 4]);
                const ar2 = ar.copyWithin(2, 0);
                expect(ar).to.equal(ar2);
            });

        });

        describe('fill', () => {

            it('fills with value', () => {
                const ar = enforce(schema, options, [1, 2, 3, 4]);
                ar.fill(10, 1, 3);
                expect(ar).to.deep.equal([1, 10, 10, 4]);
            });

            it('returns original proxy', () => {
                const ar = enforce(schema, options, [1, 2, 3, 4]);
                const ar2 = ar.fill(10, 1, 3);
                expect(ar).to.equal(ar2);
            });

            it('fills without item schema', () => {
                const schema = { type: 'array' };
                const ar = enforce(schema, options, [1, 2, 3, 4]);
                ar.fill('a', 1, 3);
                expect(ar).to.deep.equal([1, 'a', 'a', 4]);
            });

        });

        describe('filter', () => {

            it('returns filtered', () => {
                const ar = enforce(schema, options, [1, 2, 3, 4]);
                const ar2 = ar.filter(v => v % 2 === 0);
                expect(ar2).to.deep.equal([2, 4]);
            });

            it('returns new proxy', () => {
                const ar = enforce(schema, options, [1, 2, 3, 4]);
                const ar2 = ar.filter(v => v % 2 === 0);
                expect(ar2).not.to.equal(ar);
                expect(ar2.__swaggerResponseType__).to.equal('array');
            });

        });

        describe('map', () => {

            it('returns mapped', () => {
                const ar = enforce(schema, options, [1, 2, 3, 4]);
                const ar2 = ar.map(v => v * 2);
                expect(ar2).to.deep.equal([2, 4, 6, 8]);
            });

            it('returns new proxy', () => {
                const ar = enforce(schema, options, [1, 2, 3, 4]);
                const ar2 = ar.map(v => v * 2);
                expect(ar2).not.to.equal(ar);
                expect(ar2.__swaggerResponseType__).to.equal('array');
            });

        });

        describe('pop', () => {
            const schema = { type: 'array', minItems: 1 };
            const options = schemas.response.normalize({ enforce: { minItems: true } });

            it('can pop above min items', () => {
                const ar = enforce(schema, options, [1, 2]);
                const x = ar.pop();
                expect(ar).to.deep.equal([1]);
                expect(x).to.equal(2);
            });

            it('cannot pop at min items', () => {
                const ar = enforce(schema, options, [1]);
                expect(code(() => ar.pop())).to.equal('ESRLEN');
            });

        });

        describe('push', () => {

            it('valid', () => {
                const ar = enforce(schema, options, []);
                ar.push(1);
                expect(ar[0]).to.equal(1);
            });

            it('invalid', () => {
                const ar = enforce(schema, options, []);
                expect(code(() => ar.push('1'))).to.equal('ESRTYPE');
            });

            it('returns new length', () => {
                const ar = enforce(schema, options, []);
                expect(ar.push(1)).to.equal(1);
            });

            it('cannot push at max items', () => {
                const schema = { type: 'array', maxItems: 0 };
                const ar = enforce(schema, options, []);
                expect(code(() => ar.push(1))).to.equal('ESRLEN');
            });

        });

        describe('shift', () => {
            const schema = { type: 'array', minItems: 1 };
            const options = schemas.response.normalize({ enforce: { minItems: true } });

            it('can shift above min items', () => {
                const ar = enforce(schema, options, [1, 2]);
                const x = ar.shift();
                expect(ar).to.deep.equal([2]);
                expect(x).to.equal(1);
            });

            it('cannot shift at min items', () => {
                const ar = enforce(schema, options, [1]);
                expect(code(() => ar.shift())).to.equal('ESRLEN');
            });

        });

        describe('slice', () => {

            it('returns slice', () => {
                const ar = enforce(schema, options, [1, 2, 3, 4]);
                const ar2 = ar.slice(2);
                expect(ar2).to.deep.equal([3, 4]);
            });

            it('returns new proxy', () => {
                const ar = enforce(schema, options, [1, 2, 3, 4]);
                const ar2 = ar.slice(2);
                expect(ar2).not.to.equal(ar);
                expect(ar2.__swaggerResponseType__).to.equal('array');
            });

        });

        describe('splice', () => {

            it('returns removed values', () => {
                const ar = enforce(schema, options, [1, 2, 3, 4]);
                const ar2 = ar.splice(2, 2);
                expect(ar2).to.deep.equal([3, 4]);
            });

            it('returns new proxy', () => {
                const ar = enforce(schema, options, [1, 2, 3, 4]);
                const ar2 = ar.splice(2, 2);
                expect(ar2).not.to.equal(ar);
                expect(ar2.__swaggerResponseType__).to.equal('array');
            });

            it('valid new values', () => {
                const ar = enforce(schema, options, [1, 2]);
                ar.splice(1, 0, 3, 4);
                expect(ar).to.deep.equal([1, 3, 4, 2]);
            });

            it('invalid new values', () => {
                const ar = enforce(schema, options, [1, 2]);
                expect(code(() => ar.splice(1, 0, '3'))).to.equal('ESRTYPE');
            });

            it('cannot remove below min items', () => {
                const schema = { type: 'array', minItems: 1 };
                const options = schemas.response.normalize({ enforce: { minItems: true } });
                const ar = enforce(schema, options, [1, 2]);
                expect(code(() => ar.splice(1, 2))).to.equal('ESRLEN');
            });

            it('cannot add above max items', () => {
                const schema = { type: 'array', maxItems: 3 };
                const ar = enforce(schema, options, [1, 2]);
                expect(code(() => ar.splice(1, 0, 3, 4))).to.equal('ESRLEN');
            });

            it('can add and remove withing min and max items', () => {
                const schema = { type: 'array', minItems: 2, maxItems: 2 };
                const options = schemas.response.normalize({ enforce: { minItems: true } });
                const ar = enforce(schema, options, [1, 2]);
                const x = ar.splice(0, 2, 3, 4);
                expect(ar).to.deep.equal([3, 4]);
                expect(x).to.deep.equal([1, 2]);
            });

        });

        describe('unshift', () => {

            it('valid', () => {
                const ar = enforce(schema, options, []);
                ar.unshift(1);
                expect(ar[0]).to.equal(1);
            });

            it('invalid', () => {
                const ar = enforce(schema, options, []);
                expect(code(() => ar.unshift('1'))).to.equal('ESRTYPE');
            });

            it('returns new length', () => {
                const ar = enforce(schema, options, []);
                expect(ar.unshift(1)).to.equal(1);
            });

            it('cannot unshift at max items', () => {
                const schema = { type: 'array', maxItems: 0 };
                const ar = enforce(schema, options, []);
                expect(code(() => ar.unshift(1))).to.equal('ESRLEN');
            });

        });

        describe('unique items', () => {
            const options = schemas.response.normalize({ enforce: { uniqueItems: true } });
            const schema = {
                type: 'array',
                uniqueItems: true,
                items: {
                    type: 'number'
                }
            };

            it('init unique', () => {
                expect(code(() => enforce(schema, options, [1, 2, 1]))).to.equal('ESRUNIQ');
            });

            it('can add unique', () => {
                const ar = enforce(schema, options, []);
                expect(() => ar.push(1)).not.to.throw(Error);
            });

            it('cannot add duplicate', () => {
                const ar = enforce(schema, options, []);
                ar.push(1);
                expect(() => ar.push(1)).to.throw(Error);
            });

            it('can add again a popped item', () => {
                const ar = enforce(schema, options, []);
                ar.push(1);
                ar.pop();
                expect(() => ar.push(1)).not.to.throw(Error);
            });

            it('can add again a shifted item', () => {
                const ar = enforce(schema, options, []);
                ar.push(1);
                ar.shift();
                expect(() => ar.push(1)).not.to.throw(Error);
            });

            it('can add again a removed spliced item', () => {
                const ar = enforce(schema, options, []);
                ar.push(1);
                ar.splice(0, 1);
                expect(() => ar.push(1)).not.to.throw(Error);
            });

        });

        describe('nested array', () => {
            const schema = {
                type: 'array',
                items: {
                    type: 'array',
                    items: {
                        type: 'number'
                    }
                }
            };

            it('enforces init value', () => {
                expect(code(() => enforce(schema, options, [['a']]))).to.equal('ESRTYPE');
            });

            it('enforces push value', () => {
                const ar = enforce(schema, options, [[]]);
                ar.push([1]);
                expect(code(() => ar.push(['a']))).to.equal('ESRTYPE');
            });

            it('proxies inner init', () => {
                const ar = enforce(schema, options, [[]]);
                const ar2 = ar[0];
                expect(ar2.__swaggerResponseType__).to.equal('array');
            });

            it('proxies inner value', () => {
                const ar = enforce(schema, options, [[]]);
                ar.push([1]);
                const ar2 = ar[1];
                expect(ar2.__swaggerResponseType__).to.equal('array');
            });
        });

    });

    describe('object', () => {
        const options = schemas.response.normalize({});

        it('no initial value', () => {
            const schema = { type: 'object' };
            expect(() => enforce(schema, options)).not.to.throw(Error);
        });

        it('not a valid object', () => {
            const schema = { type: 'object' };
            expect(code(() => enforce(schema, options, []))).to.equal('ESRTYPE');
        });

        describe('proxy', () => {

            it('top level is proxied', () => {
                const schema = { type: 'object' };
                const o = enforce(schema, options);
                expect(o.__swaggerResponseType__).to.equal('object');
            });

            it('nested is proxied', () => {
                const schema = {
                    type: 'object',
                    properties: { foo: { type: 'object' } }
                };
                const o = enforce(schema, options);
                o.foo = {};
                expect(o.foo.__swaggerResponseType__).to.equal('object');
            });

        });

        describe('min and max properties', () => {
            const options = schemas.response.normalize({ enforce: { maxProperties: true, minProperties: true } });

            it('can delete above minProperties', () => {
                const schema = { type: 'object', minProperties: 1 };
                const o = enforce(schema, options, { foo: 1, bar: 2 });
                expect(() => delete o.bar).not.to.throw(Error);
            });

            it('cannot delete below minProperties', () => {
                const schema = { type: 'object', minProperties: 1 };
                const o = enforce(schema, options, { foo: 1 });
                expect(code(() => delete o.foo)).to.equal('ESRLEN');
            });

            it('cannot add above maxProperties', () => {
                const schema = { type: 'object', maxProperties: 1 };
                const o = enforce(schema, options, { foo: 1 });
                expect(code(() => o.bar = 5)).to.equal('ESRLEN');
            });

            it('can set at maxProperties', () => {
                const schema = { type: 'object', maxProperties: 1 };
                const o = enforce(schema, options, { foo: 1 });
                expect(() => o.foo = 2).not.to.throw(Error);
                expect(o.foo).to.equal(2);
            });

        });

        describe('specific vs additional properties', () => {
            const schema = {
                type: 'object',
                properties: { foo: { type: 'string' } },
                additionalProperties: { type: 'number' }
            };

            it('valid specific property', () => {
                const o = enforce(schema, options);
                expect(() => o.foo = 'abc').not.to.throw(Error);
            });

            it('invalid specific property', () => {
                const o = enforce(schema, options);
                expect(code(() => o.foo = 123)).to.equal('ESRTYPE');
            });

            it('valid additional property', () => {
                const o = enforce(schema, options);
                expect(() => o.bar = 123).not.to.throw(Error);
            });

            it('invalid additional property', () => {
                const o = enforce(schema, options);
                expect(code(() => o.baz = 'abc')).to.equal('ESRTYPE');
            });

        });

        describe('required properties', () => {
            const options = schemas.response.normalize({ enforce: { required: true }});

            it('top level omitted', () => {
                const schema = { type: 'object', properties: { foo: { required: true } } };
                expect(code(() => enforce(schema, options, {}))).to.equal('ESRREQ');
            });

            it('nested top level omitted', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        foo: {
                            type: 'object',
                            properties: {
                                bar: {
                                    required: true
                                }
                            }
                        }
                    }
                };

                const o = enforce(schema, options);
                expect(code(() => o.foo = {})).to.equal('ESRREQ');
            });

            it('additionalProperties', () => {
                const schema = {
                    type: 'object',
                    additionalProperties: {
                        type: 'object',
                        properties: {
                            id: {
                                required: true
                            }
                        }
                    }
                };

                const o = enforce(schema, options);
                o.abc = { id: 'abc' };
                expect(code(() => o.def = {})).to.equal('ESRREQ');
            });

            it('cannot delete required property', () => {
                const schema = { type: 'object', properties: { foo: { required: true } } };
                const o = enforce(schema, options, { foo: 1 });
                expect(code(() => delete o.foo)).to.equal('ESRREQ');
            });

            it('set all of', () => {
                const schema = { allOf: [
                    { properties: { foo: { required: true } } },
                    { properties: { foo: { type: 'string' } } }
                ]};
                const o = enforce(schema, options, { foo: 'a' });
                o.foo = 'b';
            });

            it('delete all of', () => {
                const schema = { allOf: [
                    { properties: { foo: { required: true } } },
                    { properties: { foo: { type: 'string' } } }
                ]};
                const o = enforce(schema, options, { foo: 'a' });
                expect(code(() => delete o.foo)).to.equal('ESRREQ');
            });

        });

        describe('schemaless', () => {
            const schema = { type: 'object' };

            it('array', () => {
                expect(() => enforce(schema, options, { a: [] })).not.to.throw(Error);
            });

            it('string', () => {
                expect(() => enforce(schema, options, { a: 'hello' })).not.to.throw(Error);
            });

            it('boolean', () => {
                expect(() => enforce(schema, options, { a: true })).not.to.throw(Error);
            });

            it('non serializable value', () => {
                expect(code(() => enforce(schema, options, { a: function() {} }))).to.equal('ESRTYPE');
            });

        });

        describe('property has defined type', () => {

            it('string valid', () => {
                const schema = { type: 'object', properties: { foo: { type: 'string' } } };
                expect(() => enforce(schema, options, { foo: 'hello' })).not.to.throw(Error);
            });

            it('string invalid', () => {
                const schema = { type: 'object', properties: { foo: { type: 'string' } } };
                expect(code(() => enforce(schema, options, { foo: 1 }))).to.equal('ESRTYPE');
            });

            it('unknown property', () => {
                const schema = { type: 'object', properties: {} };
                expect(code(() => enforce(schema, options, { foo: 'hello' }))).to.equal('ESRNPER');
            });

            it('additional property valid', () => {
                const schema = { type: 'object', additionalProperties: { type: 'string' } };
                expect(() => enforce(schema, options, { foo: 'hello' })).not.to.throw(Error);
            });

            it('additional property invalid', () => {
                const schema = { type: 'object', additionalProperties: { type: 'string' } };
                expect(code(() => enforce(schema, options, { foo: 1 }))).to.equal('ESRTYPE');
            });

        });

    });

    describe('primitives', () => {
        const options = schemas.response.normalize({});

        it('no initial value', () => {
            expect(code(() => enforce({}, options))).to.equal('ESRTYPE');
        });

    });

    describe('number', () => {
        const options = schemas.response.normalize({});

        it('valid below maximum', () => {
            const schema = { type: 'number', maximum: 10 };
            expect(() => enforce(schema, options, 5)).not.to.throw(Error);
        });

        it('valid at maximum', () => {
            const schema = { type: 'number', maximum: 10 };
            expect(() => enforce(schema, options, 10)).not.to.throw(Error);
        });

        it('invalid above maximum', () => {
            const schema = { type: 'number', maximum: 10 };
            expect(code(() => enforce(schema, options, 15))).to.equal('ESRNMAX');
        });

        it('invalid above exclusive maximum', () => {
            const schema = { type: 'number', maximum: 10, exclusiveMaximum: true };
            expect(code(() => enforce(schema, options, 15))).to.equal('ESRNMAX');
        });

        it('invalid at exclusive maximum', () => {
            const schema = { type: 'number', maximum: 10, exclusiveMaximum: true };
            expect(code(() => enforce(schema, options, 10))).to.equal('ESRNMAX');
        });

        it('valid above minimum', () => {
            const schema = { type: 'number', minimum: 10 };
            expect(() => enforce(schema, options, 15)).not.to.throw(Error);
        });

        it('valid at minimum', () => {
            const schema = { type: 'number', minimum: 10 };
            expect(() => enforce(schema, options, 10)).not.to.throw(Error);
        });

        it('invalid below minimum', () => {
            const schema = { type: 'number', minimum: 10 };
            expect(code(() => enforce(schema, options, 5))).to.equal('ESRNMIN');
        });

        it('invalid below exclusive minimum', () => {
            const schema = { type: 'number', minimum: 10, exclusiveMinimum: true };
            expect(code(() => enforce(schema, options, 5))).to.equal('ESRNMIN');
        });

        it('invalid at exclusive minimum', () => {
            const schema = { type: 'number', minimum: 10, exclusiveMinimum: true };
            expect(code(() => enforce(schema, options, 10))).to.equal('ESRNMIN');
        });

        it('valid multiple of', () => {
            const schema = { type: 'number', multipleOf: 10 };
            expect(() => enforce(schema, options, 20)).not.to.throw(Error);
        });

        it('invalid multiple of', () => {
            const schema = { type: 'number', multipleOf: 10 };
            expect(code(() => enforce(schema, options, 5))).to.equal('ESRNMULT');
        });

        it('valid integer', () => {
            const schema = { type: 'integer' };
            expect(() => enforce(schema, options, 5)).not.to.throw(Error);
        });

        it('invalid integer', () => {
            const schema = { type: 'integer' };
            expect(code(() => enforce(schema, options, 5.5))).to.equal('ESRNINT');
        });

    });

    describe('string', () => {
        const options = schemas.response.normalize({});

        it('valid max length', () => {
            const schema = { type: 'string', maxLength: 3 };
            expect(() => enforce(schema, options, 'abc')).not.to.throw(Error);
        });

        it('invalid max length', () => {
            const schema = { type: 'string', maxLength: 3 };
            expect(code(() => enforce(schema, options, 'abcd'))).to.equal('ESRSMAX');
        });

        it('valid min length', () => {
            const schema = { type: 'string', minLength: 3 };
            expect(() => enforce(schema, options, 'abc')).not.to.throw(Error);
        });

        it('invalid min length', () => {
            const schema = { type: 'string', minLength: 3 };
            expect(code(() => enforce(schema, options, 'a'))).to.equal('ESRSMIN');
        });

        it('valid pattern', () => {
            const schema = { type: 'string', pattern: '^[abc]$' };
            expect(() => enforce(schema, options, 'a')).not.to.throw(Error);
        });

        it('invalid pattern', () => {
            const schema = { type: 'string', pattern: '^[abc]$' };
            expect(code(() => enforce(schema, options, 'd'))).to.equal('ESRSPAT');
        });

    });

    describe('enum', () => {
        const options = schemas.response.normalize({});
        const schema = { enum: ['a']};

        it('found', () => {
            expect(() => enforce(schema, options, 'a')).not.to.throw(Error);
        });

        it('not found', () => {
            expect(code(() => enforce(schema, options, 'b'))).to.equal('ESRENUM');
        });

    });



});

function code(callback) {
    try {
        callback();
    } catch (e) {
        return e.code;
    }
    throw Error('Expected an error to be thrown but was not.');
}