'use strict';

const SwaggerResponse   = require('./bin/swagger-response');
SwaggerResponse.is      = require('./bin/is');
SwaggerResponse.to      = require('./bin/convert-to');

module.exports = SwaggerResponse;