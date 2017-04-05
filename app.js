/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------
var path = require('path');

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

var logger = require('./log').Logger;
// create a new express server
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//add customized routes
app.use('/api', require('./routes/api'));
app.use('/index', require('./routes/main'));
app.use('/', require('./routes/main'));


app.use('/test', require('./routes/test'));

/*
==============================================================
 */
process.env.PORT = 8100;
process.env.GOPATH = path.join(__dirname, "chaincode");
//process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA'
/*
 ==============================================================
 */

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

//PRO
require('./setup').initPROD();

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  logger.info("server starting on " + appEnv.url);
});
