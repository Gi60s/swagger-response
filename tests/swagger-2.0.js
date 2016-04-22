"use strict";
const expect        = require('chai').expect;
const fs            = require('fs');
const Response      = require('../bin/swagger-response');

describe('swagger-response-2.0', function() {
    
    describe('object', function() {
        var definitionContent;
        var response;

        before(function(done) {
            fs.readFile(__dirname + '/resources/object.json', 'utf8', function(err, data) {
                if (err) return done(err);
                definitionContent = data;
                done();
            })
        });

        beforeEach(function() {
            const req = { swagger: JSON.parse(definitionContent) };
            response = Response(req, 200);
        });

        it('boolean accepts boolean', function() {
            expect(function() { response.boolean = true }).to.not.throw(Error);
            expect(response.boolean).to.equal(true);
        });

        it('boolean does not accept number', function() {
            expect(function() { response.boolean = 1 }).to.throw(Error);
        });

        it('string accepts string', function() {
            expect(function() { response.string = 'foo' }).to.not.throw(Error);
            expect(response.string).to.equal('foo');
        });

        it('number accepts number', function() {
            expect(function() { response.number = 1 }).to.not.throw(Error);
            expect(response.number).to.equal(1);
        });
    });

    describe('object within object', function() {
        var definitionContent;
        var response;

        before(function(done) {
            fs.readFile(__dirname + '/resources/object-within-object.json', 'utf8', function(err, data) {
                if (err) return done(err);
                definitionContent = data;
                done();
            })
        });

        beforeEach(function() {
            const req = { swagger: JSON.parse(definitionContent) };
            response = Response(req, 200);
        });

        it('does not accept a string', function() {
            expect(function() { response.foo = 'foo'; }).to.throw(Error);
        });

        it('accepts an empty object', function() {
            var o = {};
            expect(function() { response.foo = o; }).to.not.throw(Error);
            expect(response.foo).to.haveOwnProperty('string');
            expect(response.foo.string).to.equal(undefined);
        });

        it('does not accept an invalid object', function() {
            var o = { string: true };
            expect(function() { response.foo = o; }).to.throw(Error);
        });

        it('does accept a valid object', function() {
            var o = { string: 'string' };
            expect(function() { response.foo = o; }).to.not.throw(Error);
            expect(response.foo).to.deep.equal(o);
        });
    });
    
    describe('array of strings', function() {
        var definitionContent;
        var response;

        before(function(done) {
            fs.readFile(__dirname + '/resources/array-of-strings.json', 'utf8', function(err, data) {
                if (err) return done(err);
                definitionContent = data;
                done();
            })
        });

        beforeEach(function() {
            const req = { swagger: JSON.parse(definitionContent) };
            response = Response(req, 200);
        });

        it('empty array', function() {
            var str = JSON.stringify(response);
            expect(str).to.equal('[]');
        });

        it('add empty string to array', function() {
            response.push('');
            var str = JSON.stringify(response);
            expect(str).to.equal('[""]');
        });

        it('add string to array', function() {
            response.push('hello');
            var str = JSON.stringify(response);
            expect(str).to.equal('["hello"]');
        });

        it('add number to array', function() {
            expect(function() { response.push(5); }).to.throw(Error);
        });

    });
    
    describe('array of objects', function() {
        var definitionContent;
        var response;

        before(function(done) {
            fs.readFile(__dirname + '/resources/array-of-objects.json', 'utf8', function(err, data) {
                if (err) return done(err);
                definitionContent = data;
                done();
            })
        });

        beforeEach(function() {
            const req = { swagger: JSON.parse(definitionContent) };
            response = Response(req, 200);
        });

        it('empty array', function() {
            var str = JSON.stringify(response);
            expect(str).to.equal('[]');
        });

        // TODO: add tests
    });
    
    
});

