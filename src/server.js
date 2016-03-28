'use strict';

var express = require('express');
var favicon = require('serve-favicon');
var git = require('nodegit');
var glob = require('glob');
var marked = require('marked');
var path = require('path');
var fs = require('fs');

var error = require('./lib/error');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, 'favicon.ico')));

function getRenderer(repoName) {
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
  renderer.image = function(href, title, text) {
    if (href.startsWith('http')) {
      return '<img src="' + href + '" alt="' + text + '">';
    } else {
      return '<img src="' + process.env.HOST + '/' + repoName + '/raw/master/'
        + href + '" alt="' + text + '">';
    }
  };

  return renderer;
}

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

// Get raw content.
app.get('/:name/raw/:branch/*', function(req, res, next) {
  var name = req.params.name;
  var branch = req.params.branch;
  var repo = path.join(process.env.GIT_DIR, name + '.git');
  var fpath = req.url.split('/').slice(4).join(path.sep);
  var ftype = req.url.split('.').slice(-1)[0];

  git.Repository.open(repo).then(function(repo) {
    return repo.getBranchCommit(branch);
  }).then(function(commit) {
    return commit.getEntry(fpath);
  }).then(function(entry) {
    return entry.getBlob();
  }).then(function(blob) {
    res.contentType(ftype);
    res.send(blob.content());
  }, function(error) {
    console.log(error);
    next();
  }).done();
});

app.get('/:name/files/:branch/*', function(req, res, next) {
  var name = req.params.name;
  var branch = req.params.branch;
  var repo = path.join(process.env.GIT_DIR, name + '.git');
  var fpath = req.url.split('/').slice(4).join(path.sep);
  var fname = req.url.split('/').slice(-1)[0];
  var ftype = req.url.split('.').slice(-1)[0];

  git.Repository.open(repo).then(function(repo) {
    return repo.getBranchCommit(branch);
  }).then(function(commit) {
    return commit.getEntry(fpath);
  }).then(function(entry) {
    return entry.getBlob();
  }).then(function(blob) {
    // If the file is binary, just send the raw stuff. Otherwise, pretty it up
    // a bit.
    if (blob.isBinary()) {
      res.contentType(ftype);
      res.send(blob.content());
    } else if (ftype === 'md' || ftype === 'markdown') {
      res.render('markdown', {
        name: fname,
        content: marked(blob.toString(), { renderer: getRenderer(name) })
      });
    } else {
      res.render('file', {
        name: fname,
        type: ftype,
        content: blob.toString()
      });
    }
  }, function(error) {
    console.log(error);
    next();
  }).done();

});

app.get('/:name', function(req, res, next) {
  var name = req.params.name;
  var fullName = name + '.git';
  var url = [process.env.HOST, fullName].join('/');

  // Check that the repo actually exists.
  var repos = fs.readdirSync(process.env.GIT_DIR);
  if (repos.indexOf(fullName) === -1) {
    next();
    return;
  }

  git.Repository.open(path.join(process.env.GIT_DIR, fullName))
    .then(function(repo) {
      return repo.getHeadCommit();
    }).then(function(commit) {
      return commit.getEntry('README.md');
    }).then(function(entry) {
      return entry.getBlob();
    }).then(function(blob) {
      var readme = blob.toString();
      try {
        readme = marked(readme, { renderer: getRenderer(name) });
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

error.handle(app);

app.listen(process.env.PORT);
