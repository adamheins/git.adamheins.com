'use strict';

let express = require('express');
let router = express.Router({mergeParams: true});

let git = require('nodegit');
let marked = require('marked');
let path = require('path');

let renderer = require('../lib/renderer');
let util = require('../lib/util');


router.get('/:reference/*', (req, res, next) => {
  let reference = req.params.reference;

  let filePath = req.params[0];
  let fileName = util.parseFileNameFromUrl(req.originalUrl);
  let fileType = util.parseFileTypeFromUrl(req.originalUrl);

  git.Repository.open(req.repoPath).then(repo => {
    return util.commitFromRef(repo, reference);
  }).then(commit => {
    return commit.getEntry(filePath);
  }).then(entry => {

    if (entry.isTree()) {
      return entry.getTree().then(tree => {
        res.render('browser/tree', {
          repoName: req.repoName,
          parentMap: util.mapFileHierarchy(filePath, reference, req.repoName),
          cloneUrl: req.repoCloneUrl,
          name: fileName,
          entries: util.mapTreeEntries(tree.entries(), req.originalUrl)
        });
      }).done();
    } else {
      return entry.getBlob().then(blob => {

        // If the file is binary, just send the raw stuff. Otherwise, pretty it
        // up a bit.
        if (blob.isBinary()) {
          res.contentType(fileType);
          res.send(blob.content());
        } else if (fileType === 'md' || fileType === 'markdown') {
          res.render('browser/markdown', {
            repoName: req.repoName,
            parentMap: util.mapFileHierarchy(filePath, reference, req.repoName),
            cloneUrl: req.repoCloneUrl,
            name: fileName,
            content: marked(blob.toString(), {
              renderer: renderer.getRenderer(req.repoName)
            })
          });
        } else {
          res.render('browser/file', {
            repoName: req.repoName,
            parentMap: util.mapFileHierarchy(filePath, reference, req.repoName),
            cloneUrl: req.repoCloneUrl,
            name: fileName,
            type: fileType,
            content: blob.toString()
          });
        }

      }).done();
    }

  }, err => {
    console.log(err);
    next(err);
  }).done();
});

module.exports = router;
