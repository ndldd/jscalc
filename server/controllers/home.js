/**
 * GET /
 * Home page.
 */

exports.index = function(req, res) {
  res.render('index', {preloaded: {isAuthenticated: req.isAuthenticated()}});
};
