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

  renderer.codespan = (code) => {
    return '<code class="language-none">' + code + '</code>';
  };
  renderer.code = (code, lang) => {
    if (!lang) {
      lang = 'none';
    }
    return '<pre><code class="language-' + lang + '">' + code + '</code></pre>';
  };
  renderer.image = (href, title, text) => {
    if (href.startsWith('http')) {
      return '<img src="' + href + '" alt="' + text + '">';
    } else {
      return '<img src="' + process.env.HOST + '/' + repoName + '/raw/master/'
        + href + '" alt="' + text + '">';
    }
  };

  return renderer;
}

app.get('/', (req, res) => {
  glob(path.join(process.env.GIT_DIR, '*.git'), (err, files) => {
    res.render('index', {
      repos: files.map((fp) => {
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
app.get('/:name/raw/:branch/*', (req, res, next) => {
  var name = req.params.name;
  var branch = req.params.branch;
  var repo = path.join(process.env.GIT_DIR, name + '.git');

  var fpath = req.url.split('/').slice(4).join(path.sep);
  var ftype = req.url.split('.').slice(-1)[0];

  git.Repository.open(repo).then((repo) => {
    return repo.getBranchCommit(branch);
  }).then((commit) => {
    return commit.getEntry(fpath);
  }).then((entry) => {
    return entry.getBlob();
  }).then((blob) => {
    res.contentType(ftype);
    res.send(blob.content());
  }, (error) => {
    console.log(error);
    next();
  }).done();
});

// Map each parent directory in a path to its URL.
function mapFileHierarchy(fPath, branch, repoName) {
  // Remove the file/dir at the end of the path (the current one).
  var p = fPath.split('/').slice(0, -1);

  // Map each parent directory to its URL.
  return p.reverse().map((dir, i) => {
    return {
      'dir': dir,
      'url': [process.env.HOST, repoName, 'files', branch,
              p.slice(0, p.length - i).join('/')].join('/')
    };
  });
}

// Map the names of entries in a directory to their URLs.
function mapTreeEntries(entries, fullUrl) {
  return entries.map((entry) => {
    var name = entry.path().split('/').slice(-1)[0];
    // Append a slash to directory entries to distinguish them.
    return {
      name: entry.isTree() ? name + '/' : name,
      url: [fullUrl, name].join('/')
    };
  });
}

app.get('/:name/files/:branch/*', (req, res, next) => {
  var repoName = req.params.name;
  var branch = req.params.branch;
  var repo = path.join(process.env.GIT_DIR, repoName + '.git');
  var cloneUrl = [process.env.HOST, repoName + '.git'].join('/');

  var fpath = req.url.split('/').slice(4).join(path.sep);
  var fname = req.url.split('/').slice(-1)[0];
  var ftype = req.url.split('.').slice(-1)[0];

  git.Repository.open(repo).then((repo) => {
    return repo.getBranchCommit(branch);
  }).then((commit) => {
    return commit.getEntry(fpath);
  }).then((entry) => {
    if (entry.isTree()) {
      return entry.getTree().then((tree) => {
        res.render('browser/tree', {
          repoName: repoName,
          parentMap: mapFileHierarchy(fpath, branch, repoName),
          cloneUrl: cloneUrl,
          name: fname,
          entries: mapTreeEntries(tree.entries(), req.url)
        });
      }).done();
    } else {
      return entry.getBlob().then((blob) => {
        // If the file is binary, just send the raw stuff. Otherwise, pretty it
        // up a bit.
        if (blob.isBinary()) {
          res.contentType(ftype);
          res.send(blob.content());
        } else if (ftype === 'md' || ftype === 'markdown') {
          res.render('browser/markdown', {
            repoName: repoName,
            parentMap: mapFileHierarchy(fpath, branch, repoName),
            cloneUrl: cloneUrl,
            name: fname,
            content: marked(blob.toString(), { renderer: getRenderer(repoName) })
          });
        } else {
          res.render('browser/file', {
            repoName: repoName,
            parentMap: mapFileHierarchy(fpath, branch, repoName),
            cloneUrl: cloneUrl,
            name: fname,
            type: ftype,
            content: blob.toString()
          });
        }
      }).done();
    }
  }, (error) => {
    console.log(error);
    next();
  }).done();
});

app.get('/:name', (req, res, next) => {
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
    .then((repo) => {
      return repo.getHeadCommit();
    }).then((commit) => {
      return commit.getEntry('README.md');
    }).then((entry) => {
      return entry.getBlob();
    }).then((blob) => {
      git.Repository.open(path.join(process.env.GIT_DIR, fullName))
        .then((repo) => {
          return repo.getHeadCommit();
        }).then((commit) => {
          return commit.getTree();
        }).then((tree) => {
          var readme = blob.toString();
          try {
            readme = marked(readme, { renderer: getRenderer(name) });
          } catch(err) {
            console.log('README parsing error.');
            console.log(err);
          }
          res.render('repo', {
            entries: mapTreeEntries(tree.entries(),
                                    [req.url, 'files', 'master'].join('/')),
            repo: {
              name: name,
              url: url,
              readme: readme
            }
          });
        }).done();
    }, (error) => { // Repo has no README
      console.log('No README.');
      console.log(error);
      res.render('repo', {
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
