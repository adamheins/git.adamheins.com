'use strict';

let mongoose = require('mongoose');

let repositorySchema = new mongoose.Schema({
    name: String,
    path: String,
    access: String,
    description: String,
    tags: []
});

module.exports = mongoose.model('Repository', repositorySchema, 'repositories');
