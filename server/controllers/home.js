var _ = require('lodash');
var async = require('async');
var fs = require('fs');
var jade = require('jade');
var path = require('path');

var rootDir = path.join(__dirname, '../..');
var clientDir = path.join(rootDir, 'client');

/**
 * GET /
 * Home page.
 */

exports.index = function(req, res, next) {
  var partialsDir = path.join(clientDir, 'views', 'partials_angular');
  fs.readdir(partialsDir,
      function(err, files) {
        if (err) return next(err);
        files = _.reject(files, function(file) {
          return file.indexOf('.') == 0;
        });
        async.parallel(_.map(files, function(file) {
          return function(done) {
            fs.readFile(path.join(partialsDir, file), function(err, data) {
              if (err) return done(err);
              var html = jade.compile(data)();
              done(null, '<script type="text/ng-template" id="/partials/' + path.basename(file, '.jade') + '">' +
                  html +
                  '</script>');
            });
          };
        }), function(err, results) {
          if (err) return next(err);
          res.render('index', {
            preloaded: {isAuthenticated: req.isAuthenticated()},
            partials: results.join('')
          });
        });
      });
};
