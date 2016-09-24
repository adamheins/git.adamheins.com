'use strict';

let path = require('path');

let index = require('../routes/index');
let repo = require('../routes/repo');
let content = require('../routes/content');
let raw = require('../routes/raw');

let Repository = require('../models/repository');


exports.route = function(app) {

    // Check that requested repo is public.
    app.param('name', (req, res, next, name) => {
        Repository.findOne(name, (err, repo) => {
            if (err) {
                next(err);
            } else if (repo) {
                if (repo.access !== 'PUBLIC') {
                    next(new Error(404));
                } else {
                    let dirName = req.params.name + '.git';

                    // Construct repository parameters.
                    req.repo = {
                        name:      req.params.name,
                        nameUpper: req.params.name.toUpperCase(),
                        dirName:   dirName,
                        path:      path.join(process.env.GIT_DIR, dirName),
                        cloneUrl:  [process.env.HOST, dirName].join('/'),
                        webUrl:    [process.env.HOST, req.params.name].join('/')
                    };

                    next();
                }
            } else {
                next(new Error(404));
            }
        });
    });

    app.use('/', index);
    app.use('/:name', repo);
    app.use('/:name/files', content);
    app.use('/:name/raw', raw);
};
