'use strict';

let git = require('nodegit');

exports.parseFileNameFromUrl = function(url) {
  return url.split('/').slice(-1)[0];
}

exports.parseFileTypeFromUrl = function(url) {
  return url.split('.').slice(-1)[0];
}

// Look up the supplied reference to check if it is a branch or a commit.
exports.commitFromRef = function(repo, ref) {
  return git.Branch.lookup(repo, ref, git.Branch.BRANCH.LOCAL).then(() => {
    // Reference is a branch, get the HEAD commit of that branch.
    return repo.getBranchCommit(ref);
  }, () => {
    // Reference not a branch, treat as the SHA of a commit and get that
    // commit.
    return repo.getCommit(ref);
  });
}

// Map each parent directory in a path to its URL.
exports.mapFileHierarchy = function(fPath, branch, repoName) {
  // Remove the file/dir at the end of the path (the current one).
  let parentDirs = fPath.split('/').slice(0, -1);

  // Map each parent directory to its URL.
  return parentDirs.reverse().map((dir, i) => {
    let parentPath = parentDirs.slice(0, parentDirs.length - i).join('/');
    return {
      'dir': dir,
      'url': [process.env.HOST, repoName, 'files', branch, parentPath].join('/')
    };
  });
}

// Map the names of entries in a directory to their URLs.
exports.mapTreeEntries = function(entries, fullUrl) {
  return entries.map(entry => {
    let name = entry.path().split('/').slice(-1)[0];

    // Append a slash to directory entries to distinguish them from files.
    return {
      name: entry.isTree() ? name + '/' : name,
      url: [fullUrl, name].join('/')
    };
  });
}
