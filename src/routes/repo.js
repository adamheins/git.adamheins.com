'use strict';

let express = require('express');
let router = express.Router({mergeParams: true});

let git = require('nodegit');
let log = require('npmlog');
let marked = require('marked');
let moment = require('moment');
let path = require('path');

let renderer = require('../lib/renderer');
let util = require('../lib/util');

let Sha = require('../lib/sha');


router.get('/', (req, res, next) => {
  let commit = git.Repository.open(req.repoPath)
    .then(repo => {
      return repo.getHeadCommit();
    }, err => {
      // Repo not found, throw a 404 error.
      let error = new Error('Not found.');
      error.status = 404;
      throw error;
    });

  commit.then(commit => {
      return commit.getEntry('README.md');
    }).then(entry => {
      return entry.getBlob();
    }).then(blob => {

      let author = '';
      let date = '';
      let sha = '';

      commit.then(commit => {
        author = commit.author();
        date = moment(commit.date());
        sha = new Sha(commit.sha());

        return commit.getTree();
      }).then(tree => {
        let readme = blob.toString();

        // Parse the README from markdown into html.
        try {
          readme = marked(readme, {
            renderer: renderer.getRenderer(req.repoName)
          });
        } catch(err) {
          log.info('README parsing error.');
          log.error(err);
        }

        // Generate links to all contents of the repository.
        let repoContentBaseUrl = [req.originalUrl, 'files', 'master'].join('/');
        let repoContents = util.mapTreeEntries(tree.entries(),
                                               repoContentBaseUrl);

        res.render('repo', {
          entries: repoContents,
          repo: {
            name: req.repoName,
            url: req.repoCloneUrl,
            readme: readme
          },
          author: author.name(),
          date: date.format('MMM D, YYYY'),
          sha: sha
        });

      }).done();

    }, err => {
      // Assume that errors that aren't 404's indicate that the README is not
      // present, but we can otherwise go ahead.
      if (err.status !== 404) {
        log.info('No README.');
        log.error(err);

        res.render('repo', {
          repo: {
            name: req.repoName,
            url: req.repoCloneUrl,
            readme: 'No README.'
          }
        });
      } else {
        next(err);
      }

    }).done();
});

module.exports = router;
