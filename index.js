'use strict';

const enforcer          = require('./bin/enforcer');

module.exports = SwaggerResponse;

function SwaggerResponse(schema, options, initial) {
    return enforcer(schema, options || {}, initial);
}

SwaggerResponse.is      = require('./bin/is');
SwaggerResponse.to      = require('./bin/convert-to');