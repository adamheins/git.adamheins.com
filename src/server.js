'use strict';

var express = require('express');
var path = require('path');
var glob = require('glob');
var git = require('nodegit');
var marked = require('marked');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.get('/', function(req, res) {
  glob(path.join(process.env.GIT_DIR, '*.git'), function(err, files) {
    res.render('index', {
      repos: files.map(function(fp) {
        var fn = fp.split(path.sep).slice(-1)[0];
        var name = fn.slice(0, -4); // Remove .git ending
        return {
          name: name
        };
      })
    });
  });
});

// TODO redirect when .git extension added
app.get('/:name', function(req, res) {
  var name = req.params.name;
  var url = [process.env.HOST, name].join('/');

  git.Repository.open(path.join(process.env.GIT_DIR, name + '.git'))
    .then(function(repo) {
      return repo.getHeadCommit();
    }).then(function(commit) {
      return commit.getEntry('README.md');
    }).then(function(entry) {
      return entry.getBlob();
    }).then(function(blob) {
      var readme = blob.toString();
      try {
        readme = marked(readme);
      } catch(err) {
        console.log('README parsing error.');
        console.log(err);
      }
      res.render('readme', {
        repo: {
          name: name,
          url: url,
          readme: readme
        }
      });
    }, function(error) { // Repo has no README
      console.log('No README.');
      console.log(error);
      res.render('readme', {
        repo: {
          name: name,
          url: url,
          readme: 'No README.'
        }
      });
    }).done();
});

app.listen(process.env.PORT);
