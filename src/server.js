'use strict';

var express = require('express');
var path = require('path');
var glob = require('glob');
var fs = require('fs');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.get('/', function(req, res) {
  glob(path.join(process.env.GIT_DIR, '*.git'), function(err, files) {
    res.render('index', {
      files: files.map(function(fp) {
        var fn = fp.split(path.sep).slice(-1)[0];
        var name = fn.slice(0, -4);
        var url = [process.env.HOST, fn].join('/');
        return {
          name: name,
          url: url
        };
      })
    });
  });
});

app.listen(process.env.PORT);
