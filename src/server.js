'use strict';

var express = require('express');
var favicon = require('serve-favicon');
var git = require('nodegit');
var glob = require('glob');
var marked = require('marked');
var path = require('path');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, 'favicon.ico')));

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

app.get('/:name', function(req, res) {
  var name = req.params.name + '.git';
  var url = [process.env.HOST, name].join('/');

  git.Repository.open(path.join(process.env.GIT_DIR, name))
    .then(function(repo) {
      return repo.getHeadCommit();
    }).then(function(commit) {
      return commit.getEntry('README.md');
    }).then(function(entry) {
      return entry.getBlob();
    }).then(function(blob) {
      var readme = blob.toString();
      try {
        var renderer = new marked.Renderer();
        renderer.codespan = function(code) {
          return '<code class="language-none">' + code + '</code>';
        };
        renderer.code = function(code, lang) {
          if (!lang) {
            lang = 'none';
          }
          return '<pre><code class="language-' + lang + '">' + code + '</code></pre>';
        };
        readme = marked(readme, { renderer: renderer });
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
