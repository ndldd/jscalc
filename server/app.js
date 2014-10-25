/**
 * Module dependencies.
 */

var compress = require('compression');
var connectAssets = require('connect-assets');
var errorHandler = require('errorhandler');
var express = require('express');
var request = require('request');
var logger = require('morgan');
var path = require('path');

/**
 * Controllers (route handlers).
 */

var homeController = require('./controllers/home');
var partialsController = require('./controllers/partials');

/**
 * Create Express server.
 */

var app = express();

/**
 * Express configuration.
 */

var rootDir = path.join(__dirname, '..');
var clientDir = path.join(rootDir, 'client');

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(clientDir, 'views'));
app.set('view engine', 'jade');
app.use(compress());
app.use(connectAssets({
  paths: [
    path.join(clientDir, 'bower_components'),
    path.join(clientDir, 'js'),
    path.join(clientDir, 'css')
  ],
  helperContext: app.locals
}));
app.use(logger('dev'));
app.use('/img', express.static(path.join(clientDir, 'img'), {maxAge: 3600000}));
app.use('/bower_components',
    express.static(path.join(clientDir, 'bower_components'),
    {maxAge: 3600000}));
app.use(function(req, res, next) {
  // If there is no fragment in the query params
  // then we're not serving a crawler
  if (req.url.indexOf('?_escaped_fragment_=') == -1) {
    return next();
  }

  /**
   * Serve pre-rendered static page.
   */

  request({
    url: 'http://api.phantomjscloud.com/single/browser/v1/'
        + process.env.PHANTOMJSCLOUD_KEY + '/',
    qs: {
      'requestType': 'raw',
      'targetUrl': 'http://' + process.env.PRERENDER_HOST + req.path
    }
  }, function(err, resPrerendered, body) {
    if (err) {
      console.log(err);
      return res.sendStatus(500);
    }

    var scriptTagRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

    var stripScriptTags = function(html) {
      return html.replace(scriptTagRegex, '');
    };

    res.send(stripScriptTags(body));
  });
});

/**
 * Main routes.
 */

app.get('/', homeController.index);
app.get('/edit/:calcId', homeController.index);
app.get('/partials/:name', partialsController.partials);

/**
 * 500 Error Handler.
 */

if (process.env.NODE_ENV === 'development') {
  app.use(errorhandler())
}

/**
 * Start Express server.
 */

app.listen(app.get('port'), function() {
  console.log('Express server listening on port %d in %s mode', app.get('port'),
      app.get('env'));
});

module.exports = app;
