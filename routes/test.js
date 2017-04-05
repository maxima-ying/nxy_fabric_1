/**
 * Created by jqying on 2017/3/30.
 */
var express = require('express');
var router = express.Router();
var bc = require('../setup').getBCRestApi();
var setup = require('../setup');
var utils = require('../fabric-client/lib/utils.js');


var logger = utils.getLogger('utils/BlockChainHFCAPI.js');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('test', { title: 'Express' });
});

/*
router.get('/chaincode/init', function(req, res, next) {
    logger.info('/chaincode/init  ----start----');
    bc.chaincode_init(setup.getMember(),function(err, result){
        if(err){
            logger.error('/chaincode/init  ----error----');
        }
        else{
            logger.info('/chaincode/init  ----end----');
        }
    });
    res.render('index', { title: 'Express' });
});

router.get('/chaincode/invoke', function(req, res, next) {
    logger.info('/chaincode/invoke  ----start----');
    bc.chaincode_invoke(setup.getMember(),function(err, result){
        if(err){
            logger.error('/chaincode/invoke  ----error----');
        }
        else{
            logger.info('/chaincode/invoke  ----end---- result : ' + result);
        }
    });
    res.render('index', { title: 'Express' });
});
*/
router.get('/chaincode/query', function(req, res, next) {
    logger.info('/chaincode/query  ----start----');
    bc.chaincode_query(setup.getMember(),function(err, result){
        if(err){
            logger.error('/chaincode/query  ----error----');
        }
        else{
            logger.info('/chaincode/query  ----end---- result : ' + result);
        }
    });
    res.render('test', { title: 'Express' });
});

router.get('/chaincode/invoke', function(req, res, next) {
    logger.info('/chaincode/invoke  ----start----');
    bc.chaincode_invoke(setup.getMember(),function(err, result){
        if(err){
            logger.error('/chaincode/invoke  ----error----');
        }
        else{
            logger.info('/chaincode/invoke  ----end---- result : ' + result);
        }
    });
    res.render('test', { title: 'Express' });
});


module.exports = router;
