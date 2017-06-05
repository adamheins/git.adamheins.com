'use strict';

let path = require('path');

let index = require('../routes/index');
let repoRoute = require('../routes/repo');
let content = require('../routes/content');
let raw = require('../routes/raw');

let repos = require('./repos');


exports.route = function(app) {
    // Check that requested repo is public.
    app.param('name', (req, res, next, name) => {
        let repo = repos.get(name);
        if (repo) {
            if (repo.access !== 'PUBLIC') {
                next(new Error(404));
            } else {
                // Construct repository parameters.
                req.repo = {
                    name:      repo.name,
                    nameUpper: repo.name.toUpperCase(),
                    dirName:   repo.path,
                    path:      path.join(process.env.GIT_DIR, repo.path),
                    cloneUrl:  [process.env.HOST, repo.path].join('/'),
                    webUrl:    [process.env.HOST, repo.name].join('/')
                };

                next();
            }
        } else {
            next(new Error(404));
        }
    });

    app.use('/', index);
    app.use('/:name', repoRoute);
    app.use('/:name/files', content);
    app.use('/:name/raw', raw);
};
