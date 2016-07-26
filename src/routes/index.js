'use strict';

let express = require('express');
let router = express.Router();

let Repository = require('../models/repository');

router.get('/', (req, res) => {
  Repository.find({access: 'PUBLIC'}).sort({name: 1}).exec((err, repos) => {
    res.render('index', {'repos': repos});
  });
});

module.exports = router;
