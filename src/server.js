'use strict';

let express = require('express');
let favicon = require('serve-favicon');
let fs = require('fs');
let log = require('npmlog');
let mongoose = require('mongoose');
let path = require('path');

let error = require('./lib/error');
let router = require('./lib/router');


let app = express();

// Connect to the database.
mongoose.connect(process.env.MONGO_URI);

// Logging.
log.level = process.env.LOG_LEVEL;
log.stream = fs.createWriteStream(process.env.LOG_FILE);
log.maxRecordSize = 1000;

// View engine.
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Favicon.
app.use(favicon(path.join(__dirname, 'favicon.ico')));

router.route(app);
error.handle(app);

app.listen(process.env.PORT);
