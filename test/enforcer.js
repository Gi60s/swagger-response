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

            it('invalid', () => {
                const c = code(() => enforce(schema, options, ['1']));
                expect(c).to.equal('ESRTYPE');
            });

        });

        // TODO: validate length changes and unique changes

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

});

function code(callback) {
    try {
        callback();
    } catch (e) {
        return e.code;
    }
    throw Error('Expected an error to be thrown but was not.');
}