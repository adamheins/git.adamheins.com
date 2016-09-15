'use strict';

let log = require('npmlog');

// Handle http errors.
exports.handle = function(app) {

  // Catch 404 error and forward it to the error handler.
  app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  // Error handler. Provides a custom page for 404 errors.
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);

    log.error(err);

    if (err.status === 404) {
      res.render('error', {
        status: '404',
        message: 'Page not found',
        description: "The page you were looking for isn't here! You can "
                   + "try heading back to the <a href='/'>homepage</a>."
      });
    } else {
      res.render('error', {
        status: err.status,
        message: err.message,
        description: "It looks like something went wrong. You can try "
                   + "heading back to the <a href='/'>homepage</a>."
      });
    }
  });
};
