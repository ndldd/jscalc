/**
 * GET /
 * Partials.
 */

exports.partials = function (req, res) {
  var name = req.params.name;
  res.render('partials_angular/' + name);
};
