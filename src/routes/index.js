'use strict';

let express = require('express');
let router = express.Router();

let repos = require('../lib/repos');

router.get('/', (req, res) => {
    let repoList = repos.all().map(repo => {
        repo.nameUpper = repo.name.toUpperCase();
        return repo;
    });
    res.render('index', {'repos': repoList});
});

module.exports = router;
