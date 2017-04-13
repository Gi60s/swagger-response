'use strict';

const enforcer          = require('./bin/enforcer');

module.exports = {
    enforcer:   enforcer.enforcer,
    is:         require('./bin/is'),
    same:       require('./bin/same'),
    to:         require('./bin/convert-to'),
    validate:   enforcer.validate
};