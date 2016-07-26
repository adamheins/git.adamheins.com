'use strict';

class Sha {
  constructor(sha) {
    this.long = sha;
    this.short = sha.substring(0, 7);
  }

  getLong() {
    return this.long;
  }

  getShort() {
    return this.short;
  }
}

module.exports = Sha;
