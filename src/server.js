'use strict';

let express = require('express');
let fs = require('fs');
let log = require('npmlog');
let path = require('path');

let error = require('./lib/error');
let router = require('./lib/router');
let repos = require('./lib/repos');


let app = express();

// Logging.
log.level = process.env.LOG_LEVEL;
log.stream = fs.createWriteStream(process.env.LOG_FILE);
log.maxRecordSize = 1000;

// View engine.
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

repos.load('repos.yaml');
router.route(app);
error.handle(app);

app.listen(process.env.PORT);
