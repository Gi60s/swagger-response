"use strict";
const expect        = require('chai').expect;
const fs            = require('fs');
const Response      = require('../bin/swagger-response');

describe('swagger-response-2.0', function() {

    describe('#', function() {

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

            it('string fails', function() {
                expect(function() { response.foo = 'foo'; }).to.throw(Error);
            });

            it('empty object passes', function() {
                var o = {};
                expect(function() { response.foo = o; }).to.not.throw(Error);
                expect(response.foo).to.haveOwnProperty('string');
                expect(response.foo.string).to.equal(undefined);
            });

            it('invalid object fails', function() {
                var o = { string: true };
                expect(function() { response.foo = o; }).to.throw(Error);
            });

            it('valid object passes', function() {
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

            it('initializes to empty array', function() {
                var str = JSON.stringify(response);
                expect(str).to.equal('[]');
            });

            it('add empty string to array passes', function() {
                response.push('');
                var str = JSON.stringify(response);
                expect(str).to.equal('[""]');
            });

            it('add string to array passes', function() {
                response.push('hello');
                var str = JSON.stringify(response);
                expect(str).to.equal('["hello"]');
            });

            it('add number to array fails', function() {
                expect(function() { response.push(5); }).to.throw(Error);
            });

            it('add valid item by index passes', function() {
                expect(function() { response[0] = 'hello'; }).to.not.throw(Error);
                expect(response[0]).to.equal('hello');
            });

            it('add invalid item by index fails', function() {
                expect(function() { response[0] = 1; }).to.throw(Error);
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

            it('initializes to empty array', function() {
                var str = JSON.stringify(response);
                expect(str).to.equal('[]');
            });

            it('add empty object passes', function() {
                expect(function() { response.push({}); }).to.not.throw(Error);
            });

            it('add object with valid property passes', function() {
                expect(function() { response.push({ city: 'Foo' }); }).to.not.throw(Error);
            });

            it('update object at index with valid property passes', function() {
                expect(function() {
                    response.push({ city: 'Foo' });
                    response.get(0).zipcode = 123456;
                }).to.not.throw(Error);
            });

            it('add object with invalid property fails', function() {
                expect(function() { response.push({ foo: 'Foo' }); }).to.throw(Error);
            });
        });

    });

    describe('#injectParameters', function() {
        
        it('recursive defaults to false', function() {
            
        });
        
    });

    describe('#manageable', function() {

        it('unmanageable', function() {
            const req = {
                swagger: {
                    operation: {
                        responses: {
                            '200': {
                                schema: {
                                    type: 'string'
                                }
                            }
                        }
                    }
                }
            };
            expect(Response.manageable(req, 200)).to.equal(false);
        });

        it('unmanageable', function() {
            const req = {
                swagger: {
                    operation: {
                        responses: {
                            '200': {
                                schema: {
                                    type: 'object'
                                }
                            }
                        }
                    }
                }
            };
            expect(Response.manageable(req, 200)).to.equal(true);
        });

    });
    
});

