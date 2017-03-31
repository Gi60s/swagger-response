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
                expect(() => enforce.array(schema, '', options, ['a', true, 1, null], false)).not.to.throw(Error);
            });

            it('non serializable value', () => {
                expect(code(() => enforce.array(schema, '', options, [function() {}], false))).to.equal('ESRTYPE');
            });

        });

        describe('initialize to value', () => {

            it('valid', () => {
                expect(() => enforce.array(schema, '', options, [1, 2, 3], false)).not.to.throw(Error);
            });

            it('invalid', () => {
                const c = code(() => enforce.array(schema, '', options, ['1'], false));
                expect(c).to.equal('ESRTYPE');
            });

        });

        describe('set by index', () => {

            it('valid', () => {
                const ar = enforce.array(schema, '', options, [], false);
                ar[0] = 1;
                expect(ar[0]).to.equal(1);
            });

            it('invalid', () => {
                const ar = enforce.array(schema, '', options, [], false);
                expect(code(() => ar[0] = '1')).to.equal('ESRTYPE');
            });

        });

        describe('concat', () => {

            it('valid', () => {
                const ar = enforce.array(schema, '', options, [], false);
                const ar2 = ar.concat(1);
                expect(ar2[0]).to.equal(1);
            });

            it('invalid', () => {
                const ar = enforce.array(schema, '', options, [], false);
                expect(code(() => ar.concat('1'))).to.equal('ESRTYPE');
            });

            it('returns new proxy', () => {
                const ar = enforce.array(schema, '', options, [], false);
                const ar2 = ar.concat(1);
                expect(ar2).not.to.equal(ar);
                expect(ar2.__swaggerResponseType__).to.equal('array');
            });

        });

        describe('copyWithin', () => {

            it('makes copy within', () => {
                const ar = enforce.array(schema, '', options, [1, 2, 3, 4], false);
                ar.copyWithin(2, 0);
                expect(ar).to.deep.equal([1, 2, 1, 2]);
            });

            it('returns original proxy', () => {
                const ar = enforce.array(schema, '', options, [1, 2, 3, 4], false);
                const ar2 = ar.copyWithin(2, 0);
                expect(ar).to.equal(ar2);
            });

        });

        describe('fill', () => {

            it('fills with value', () => {
                const ar = enforce.array(schema, '', options, [1, 2, 3, 4], false);
                ar.fill(10, 1, 3);
                expect(ar).to.deep.equal([1, 10, 10, 4]);
            });

            it('returns original proxy', () => {
                const ar = enforce.array(schema, '', options, [1, 2, 3, 4], false);
                const ar2 = ar.fill(10, 1, 3);
                expect(ar).to.equal(ar2);
            });

        });

        describe('filter', () => {

            it('returns filtered', () => {
                const ar = enforce.array(schema, '', options, [1, 2, 3, 4], false);
                const ar2 = ar.filter(v => v % 2 === 0);
                expect(ar2).to.deep.equal([2, 4]);
            });

            it('returns new proxy', () => {
                const ar = enforce.array(schema, '', options, [1, 2, 3, 4], false);
                const ar2 = ar.filter(v => v % 2 === 0);
                expect(ar2).not.to.equal(ar);
                expect(ar2.__swaggerResponseType__).to.equal('array');
            });

        });

        describe('map', () => {

            it('returns mapped', () => {
                const ar = enforce.array(schema, '', options, [1, 2, 3, 4], false);
                const ar2 = ar.map(v => v * 2);
                expect(ar2).to.deep.equal([2, 4, 6, 8]);
            });

            it('returns new proxy', () => {
                const ar = enforce.array(schema, '', options, [1, 2, 3, 4], false);
                const ar2 = ar.map(v => v * 2);
                expect(ar2).not.to.equal(ar);
                expect(ar2.__swaggerResponseType__).to.equal('array');
            });

        });

        describe('push', () => {

            it('valid', () => {
                const ar = enforce.array(schema, '', options, [], false);
                ar.push(1);
                expect(ar[0]).to.equal(1);
            });

            it('invalid', () => {
                const ar = enforce.array(schema, '', options, [], false);
                expect(code(() => ar.push('1'))).to.equal('ESRTYPE');
            });

            it('returns new length', () => {
                const ar = enforce.array(schema, '', options, [], false);
                expect(ar.push(1)).to.equal(1);
            });

        });

        describe('slice', () => {

            it('returns slice', () => {
                const ar = enforce.array(schema, '', options, [1, 2, 3, 4], false);
                const ar2 = ar.slice(2);
                expect(ar2).to.deep.equal([3, 4]);
            });

            it('returns new proxy', () => {
                const ar = enforce.array(schema, '', options, [1, 2, 3, 4], false);
                const ar2 = ar.slice(2);
                expect(ar2).not.to.equal(ar);
                expect(ar2.__swaggerResponseType__).to.equal('array');
            });

        });

        describe('splice', () => {

            it('returns removed values', () => {
                const ar = enforce.array(schema, '', options, [1, 2, 3, 4], false);
                const ar2 = ar.splice(2, 2);
                expect(ar2).to.deep.equal([3, 4]);
            });

            it('returns new proxy', () => {
                const ar = enforce.array(schema, '', options, [1, 2, 3, 4], false);
                const ar2 = ar.splice(2, 2);
                expect(ar2).not.to.equal(ar);
                expect(ar2.__swaggerResponseType__).to.equal('array');
            });

            it('valid new values', () => {
                const ar = enforce.array(schema, '', options, [1, 2], false);
                ar.splice(1, 0, 3, 4);
                expect(ar).to.deep.equal([1, 3, 4, 2]);
            });

            it('invalid new values', () => {
                const ar = enforce.array(schema, '', options, [1, 2], false);
                expect(code(() => ar.splice(1, 0, '3'))).to.equal('ESRTYPE');
            });

        });

        describe('unshift', () => {

            it('valid', () => {
                const ar = enforce.array(schema, '', options, [], false);
                ar.unshift(1);
                expect(ar[0]).to.equal(1);
            });

            it('invalid', () => {
                const ar = enforce.array(schema, '', options, [], false);
                expect(code(() => ar.unshift('1'))).to.equal('ESRTYPE');
            });

            it('returns new length', () => {
                const ar = enforce.array(schema, '', options, [], false);
                expect(ar.unshift(1)).to.equal(1);
            });

        });

    });

    describe('object', () => {
        const options = schemas.response.normalize({});

        describe('schemaless items', () => {
            const schema = { type: 'object' };

            it('mixed', () => {
                expect(() => enforce.object(schema, '', options, ['a', true, 1, null], false)).not.to.throw(Error);
            });

            it('non serializable value', () => {
                expect(code(() => enforce.object(schema, '', options, [function() {}], false))).to.equal('ESRTYPE');
            });

        });

        describe('schemaless items', () => {
            const schema = { type: 'object' };

            it('mixed', () => {
                expect(() => enforce.object(schema, '', options, ['a', true, 1, null], false)).not.to.throw(Error);
            });

            it('non serializable value', () => {
                expect(code(() => enforce.object(schema, '', options, [function() {}], false))).to.equal('ESRTYPE');
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