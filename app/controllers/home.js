/*!
 * Module dependencies.
 */

exports.index = function(req, res) {
  res.render('home/index', {
    title: 'Node Express Mongoose Boilerplate'
  });
};
