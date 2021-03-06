'use strict';

let express = require('express');
let router = express.Router({mergeParams: true});

let git = require('nodegit');
let log = require('npmlog');
let path = require('path');

let util = require('../lib/util');


router.get('/:reference/*', (req, res, next) => {
    let reference = req.params.reference;

    let filePath = req.params[0];
    let fileType = util.parseFileTypeFromUrl(req.originalUrl);

    git.Repository.open(req.repo.path).then(repo => {
        return util.commitFromRef(repo, reference);
    }).then(commit => {
        return commit.getEntry(filePath);
    }).then(entry => {
        return entry.getBlob();
    }).then(blob => {
        res.contentType(fileType);
        res.send(blob.content());
    }, err => {
        log.error(err);
        next(err);
    }).done();
});


module.exports = router;
