"use strict";
const expect        = require('chai').expect;
const Response      = require('../bin/swagger-response');

describe('#lambda', function() {

    it('object response', function() {
        return Response.lambda({ url: '/pets/1234' }, 200, __dirname + '/resources/swagger.yaml')
            .then(function(response) {
                expect(JSON.stringify(response)).to.equal('{}');
            });
    });

    it('array response', function() {
        return Response.lambda({ url: '/pets' }, 200, __dirname + '/resources/swagger.yaml')
            .then(function(response) {
                expect(JSON.stringify(response)).to.equal('[]');
            });
    });


});