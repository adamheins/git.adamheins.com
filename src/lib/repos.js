'use strict';

let fs = require('fs');
let yaml = require('js-yaml');


let repoList = [];
let repoMap = {};


// Load repo data from file.
module.exports.load = function(filePath) {
    let data = yaml.safeLoad(fs.readFileSync(filePath, 'utf8'));

    // Filter out non-public repos.
    repoList = data.repos.filter(repo => {
        return repo.access === 'PUBLIC';
    });

    // Sort repo list alphabetically by name.
    repoList.sort((a, b) => {
        if (a.name < b.name) {
            return -1;
        } else if (a.name > b.name) {
            return 1;
        }
        return 0;
    });

    // Build map of repositories by name.
    repoList.forEach(repo => {
        repoMap[repo.name] = repo;
    });
};


// Retrieve one repository by name.
module.exports.get = function(name) {
    return repoMap[name];
};


// Get a list of all of the repos.
module.exports.all = function() {
    return repoList;
};
