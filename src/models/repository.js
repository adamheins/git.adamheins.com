'use strict';

var mongoose = require('mongoose');

var repositorySchema = new mongoose.Schema({
  name: String,
  path: String,
  access: String,
  description: String,
  tags: []
});

module.exports = mongoose.model('Repository', repositorySchema, 'repositories');
