/**
 * Created by Ditty on 16/5/20.
 */
var express = require('express');
var router = express.Router();
var ls = require('../utils/LocalStore');
var logger = require('../log').Logger;

/* GET home page. */
router.get('/', function(req, res, next) {
    //console.log('home page!');
    logger.info('home page!');
  var token = req.query['token'];
  //console.log(token);
  var auth = require('../utils/Auth');
  var user = auth.validateToken(token);
  if (user) {
    user = auth.validateUser(user);
  }
  var lang = ls.loadLanguage();

  var data = {};
  data.lang = lang;
  data.token = token;
  data.user = user;
  data.cash = process.env.cashID;
  res.render('main', data);
});

module.exports = router;