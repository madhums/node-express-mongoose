
/*!
 * Module dependencies.
 */

exports.index = function (req, res) {
  res.render('home/index', {
    title: 'Node Express Mongoose Boilerplate'
  });
};

exports.main = function (req, res) {

  console.log("IN main ");
  res.render('home/main', {
    title: 'Node Express Mongoose Boilerplate'
  });
};
