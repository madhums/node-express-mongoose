/**
 * Created by knyamagoudar on 4/26/17.
 */

exports.index = function (req, res) {
  res.render('home/login', {
    title: 'Node Express Mongoose Login'
  });
};


exports.authenticate = function(req,res){

  if(req.body.name === 'nihar' && req.body.password === 'nihar'){
    console.log("NIhar is authenticated");
    //res.redirect('/home');
    res.json({status:'success'});
  }
}