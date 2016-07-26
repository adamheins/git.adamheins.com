'use strict';

var express = require('express');
var favicon = require('serve-favicon');
var path = require('path');
var mongoose = require('mongoose');

let error = require('./lib/error');
let router = require('./lib/router');


mongoose.connect(process.env.MONGO_URI);

let app = express();

// View engine.
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Favicon.
app.use(favicon(path.join(__dirname, 'favicon.ico')));

router.route(app);
error.handle(app);

app.listen(process.env.PORT);
