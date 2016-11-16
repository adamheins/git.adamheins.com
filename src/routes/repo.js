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


// Convert a blob to a README, attempting to parse as markdown.
function readmeFromBlob(blob, renderer) {
    let readme = blob.toString();

    // Parse the README from markdown into html.
    try {
        return marked(readme, {
            renderer: renderer
        });
    } catch(err) {
        log.info('README parsing error.');
        log.error(err);
        return readme;
    }
    return '';
}


// Render the repository home page.
function renderRepo(req, res, tree, readme, lastCommit) {
    // Generate links to all contents of the repository at the head of
    // the master branch.
    let repoContentBaseUrl = [req.originalUrl, 'files', 'master'].join('/');

    let repo = req.repo;
    repo.readme = readme;
    repo.entries = util.mapTreeEntries(tree.entries(), repoContentBaseUrl);

    lastCommit.then(lastCommit => {
        res.render('repo', {
            repo: repo,
            lastCommit: lastCommit
        });
    }).done();
}


// Get information about the commit.
function getCommitInfo(commit) {
    let author = commit.author();
    let date = moment(commit.date());
    let sha = new Sha(commit.sha());
    return {
        author: author.name(),
        date: date.format('MMM D, YYYY'),
        sha: sha
    };
}


router.get('/', (req, res, next) => {
    // Get the head commit of the repository.
    let commit = git.Repository.open(req.repo.path).then(repo => {
        return repo.getHeadCommit();
    }, err => {
        // Repo not found, throw a 404 error.
        let error = new Error('Not found.');
        error.status = 404;
        throw error;
    });

    // Gather information about the last commit.
    let lastCommit = commit.then(commit => {
        return getCommitInfo(commit);
    });

    commit.then(commit => {
        return commit.getTree();
    }).then(tree => {
        commit.then(commit => {
            return commit.getEntry('README.md');
        }).then(entry => {
            return entry.getBlob();
        }).then(blob => {
            // Have README.
            let readme = readmeFromBlob(blob, renderer.getRenderer(req.repo.name));
            renderRepo(req, res, tree, readme, lastCommit);
        }, err => {
            // No README.
            // Assume that errors that aren't 404's indicate that the README is not
            // present, but we can otherwise go ahead.
            if (err.status !== 404) {
                log.info('No README.');
                log.error(err);

                renderRepo(req, res, tree, '', lastCommit);
            } else {
                next(err);
            }
        }).done();
    }).done();
});

module.exports = router;
