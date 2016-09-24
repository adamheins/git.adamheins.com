'use strict';

let express = require('express');
let router = express.Router({mergeParams: true});

let git = require('nodegit');
let log = require('npmlog');
let marked = require('marked');
let path = require('path');

let renderer = require('../lib/renderer');
let util = require('../lib/util');


router.get('/:reference/*', (req, res, next) => {
    let reference = req.params.reference;

    let filePath = req.params[0];
    let fileName = util.parseFileNameFromUrl(req.originalUrl);
    let fileType = util.parseFileTypeFromUrl(req.originalUrl);

    git.Repository.open(req.repo.path).then(repo => {
        return util.commitFromRef(repo, reference);
    }).then(commit => {
        return commit.getEntry(filePath);
    }).then(entry => {
        // Parameters common to all render paths.
        let renderParams = {
            repo: req.repo,
            file: {
                name: fileName,
                parentMap: util.mapFileHierarchy(filePath, reference,
                                                 req.repo.name)
            }
        }

        if (entry.isTree()) {
            return entry.getTree().then(tree => {
                renderParams.file.entries = util.mapTreeEntries(tree.entries(),
                                                                req.originalUrl);
                res.render('browser/tree', renderParams);
            }).done();
        } else {
            return entry.getBlob().then(blob => {
                // If the file is binary, just send the raw stuff. Otherwise,
                // pretty it up a bit.
                if (blob.isBinary()) {
                    res.contentType(fileType);
                    res.send(blob.content());
                } else {
                    renderParams.file.rawUrl = req.originalUrl.replace('files', 'raw');
                    if (fileType === 'md' || fileType === 'markdown') {
                        renderParams.file.content = marked(blob.toString(), {
                            renderer: renderer.getRenderer(req.repo.name)
                        });
                        res.render('browser/markdown', renderParams);
                    } else {
                        renderParams.file.type = fileType;
                        renderParams.file.content = blob.toString();
                        res.render('browser/file', renderParams);
                    }
                }
            }).done();
        }
    }, err => {
        log.error(err);
        next(err);
    }).done();
});

module.exports = router;
