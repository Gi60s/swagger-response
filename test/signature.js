'use strict';
const expect        = require('chai').expect;
const signature     = require('../bin/signature');

describe('signature', () => {

    it('two similar objects', () => {
        const x = { a: 1, b: 2 };
        const y = { b: 2, a: 1 };
        expect(signature(x).equal(y)).to.be.true;
    });

    it('two similar arrays', () => {
        const x = [ 1, 2, { a: 1, b: 2 } ];
        const y = [ 1, 2, { b: 2, a: 1 } ];
        expect(signature(x).equal(x)).to.be.true;
    });

    it('recursive objects', () => {
        const a = {};
        a.b = { a: a };
        expect(() => signature(a, { recursive: true })).not.to.throw(Error);
    });

    it('two similar recursive objects', () => {
        const a = {};
        a.b = { a: a };

        const a2 = {};
        a2.b = { a: a2 };

        expect(signature(a, { recursive: true }).equal(a2)).to.be.true;
    });

});