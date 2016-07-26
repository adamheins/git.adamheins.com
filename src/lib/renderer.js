'use strict';

let marked = require('marked');

let renderer = null;

exports.getRenderer = function(repoName) {
  // Singleton.
  if (renderer !== null) {
    return renderer;
  }

  renderer = new marked.Renderer();

  // Inline code should be prismified.
  renderer.codespan = (code) => {
    return '<code class="language-none">' + code + '</code>';
  };

  // Code blocks should also be prismified.
  renderer.code = (code, lang) => {
    if (!lang) {
      lang = 'none';
    }
    return '<pre><code class="language-' + lang + '">' + code + '</code></pre>';
  };

  // Make image src attributes point to the raw content endpoint.
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


