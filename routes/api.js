"use strict";
var jwt = require('jsonwebtoken');
var auth = require('../utils/Auth');
var fs = require('fs');
var ls = require('../utils/LocalStore');
var workflow = require('../utils/Workflow');
var bc = require('../setup').getBCRestApi();
var logger = require('../log').Logger;

var express = require('express');
var router = express.Router();

//TODO: debug start
var bc = require('../setup').getBCRestApi();
var setup = require('../setup');
//TODO: debug end

/* GET home page. */
router.get('/', function(req, res, next) {
  var token = jwt.sign({ userid: 'admin', passwd: '123456' }, process.env.JWT_SECRET);
  var lang = ls.loadLanguage();
  var data = {};
  data.lang = lang;
  data.token = token;
  res.render('api', data);
});

/**
 * 用户登录
 */
router.post('/login', function(req, res, next) {
  logger.info('login: begin.');

  var user = {
    username: req.body.username,
    passwd: req.body.passwd
  };
  var decoded = auth.validateUser(user);
  logger.info('用户登录认证信息：%j', decoded);
  if (decoded != null) {
    var token = jwt.sign({username: user.username, passwd: user.passwd}, process.env.JWT_SECRET);
    logger.info('Token Generated : [' + token + ']');
    res.send({result: true, token: token});
  } else {
    logger.info('用户登录失败:%j', user);
    res.send({result: false});
  }
});

router.get('/task/list', function(req, res, next) {
  var token = req.header('token');
  logger.info('TOKEN=%j', token);
  try {
    var user = auth.validateToken(req.header('token'));
    if (user == null) {
        throwError('Token is not valid.');
    }
    user = auth.validateUser(user);
    token = jwt.sign(user, process.env.JWT_SECRET);
    // logger.info("current user: " + JSON.stringify(user));

    var tasks = ls.loadBills(user.step);
    res.send({token: token, tasks: tasks});
  } catch(err) {
    res.send({err: err});
  }
});

router.get('/task', function(req, res, next) {
  logger.info('TOKEN=%j', req.header('token'));
  try {
    var decoded = jwt.verify(req.header('token'), process.env.JWT_SECRET);
    var token = jwt.sign(decoded, process.env.JWT_SECRET);
    logger.info(decoded);
    var task = ls.loadBill(req.query["id"]);
    var lang = ls.loadLanguage();
    res.send({token: token, task: task, lang: lang});
  } catch(err) {
    res.send({err: err});
  }
});

router.post('/sign/init', function(req, res, next) {
  logger.info('TOKEN=%j', req.header('token'));
  try {
    var decoded = jwt.verify(req.header('token'), process.env.JWT_SECRET);
    var token = jwt.sign(decoded, process.env.JWT_SECRET);
    logger.info(decoded);

  } catch(err) {
    res.send({err: err});
    return;
  }

  var data = req.body;
  var bill_no = '000' + new Date().getTime();

  // 票据番号，状态，承认FLG(1承认0拒绝）
  var params = [bill_no, '01', '1'];

  /*
  var invokeTx = bc.invokeSign(null, 'initStatus', params);
  invokeTx.on('submitted',function(results) {
    logger.info(results);
    data['bill_no'] = bill_no;
    data['current_step'] = workflow.getStep('01');
    if(!data['txid']){
      data['txid'] = [];
    }
    data['txid'].push(results.uuid);
    ls.addBill(data);
    res.send({result: true, token: token});
  });
*/
    var invokeTx = bc.invokeSign(null, 'initStatus', params, function(err,results){
        logger.info(results);
        data['bill_no'] = bill_no;
        data['current_step'] = workflow.getStep('01');
        if(!data['txid']){
            data['txid'] = [];
        }
        data['txid'].push(results.uuid);
        ls.addBill(data);
        res.send({result: true, token: token});
    });
});

router.post('/sign/invoke', function(req, res, next) {
    var decoded = {};
    var token = {};
    try {
        decoded = jwt.verify(req.header('token'), process.env.JWT_SECRET);
        token = jwt.sign(decoded, process.env.JWT_SECRET);
    } catch(err) {
        logger.info(err);
        res.send({err: err});
        return;
    }

    var data = req.body;
    logger.info(data);
    var currentStep = workflow.getStep(data.step);
    var nextStep = workflow.getStep(currentStep.actions.next.id);
    var backFlg = data.next && data.next == 0;
    if (backFlg) {
        if (currentStep.actions.back) {
            nextStep = workflow.getStep(currentStep.actions.back.id);
        } else {
            res.send({err: '流程错误!', token: token});
        }
    }

    var bill = ls.loadBill(data.bill_no);
    //var params = [data.bill_no, nextStep.id];
    var params = [data.bill_no, currentStep.id];

    // 03 (提出申请/申込) 以外的场合, 会去invokeSign (其中02，08两步，除了更新状态外，还有金额的计算)
    if (nextStep.id != '03') {

        if (backFlg) {
            params.push('0');
        } else {
            params.push('1');
        }
        bc.invokeSign(null, 'updateStatus', params, function(err, result) {
            if (err) {
                res.send({result: false, token: token, err: JSON.stringify(err)});
                return;
            }
            logger.info(result);
            bill.current_step = nextStep;
            ls.saveBill(bill);

            if (nextStep.id == '08') {
                //transfer cash & bill (Sale)
                var accountSale = ls.loadAccount('P1');
                logger.info(accountSale.cash + '+' + bill.amount + '=>');
                accountSale.cash = "" + ((accountSale.cash * 1) + (bill.amount * 1));
                logger.info(accountSale.cash);
                accountSale.bill = "" + ((accountSale.bill * 1) - (bill.face_amount * 1));

                //transfer cash & bill (Buyin)
                var accountBuy = ls.loadAccount('P2');
                logger.info(accountBuy);
                logger.info(accountBuy.cash + '-' + bill.amount + '=>');
                accountBuy.cash = "" + ((accountBuy.cash * 1) - (bill.amount * 1));
                logger.info(accountBuy.cash);
                accountBuy.bill = "" + ((accountBuy.bill * 1) + (bill.face_amount * 1));

                var cashParams = ['P2', 'P1', bill.amount];
                bc.invokeCash(null, 'transfer', cashParams, function(err, result) {
                    if (err) {
                        res.send({result: false, token: token, err: JSON.stringify(err)});
                        return;
                    }
                });
                logger.info(result);
                ls.saveAccount(accountBuy);
                ls.saveAccount(accountSale);
            }

            //rollback bill
            if (nextStep.id == '02' && backFlg) {
                //rollback bill creation (Sale)
                var accountSale = ls.loadAccount('P1');
                logger.info(accountSale);
                logger.info(accountSale.bill + '-' + bill.face_amount + '=>');
                accountSale.bill = "" + ((accountSale.bill * 1) - (bill.face_amount * 1));
                logger.info(accountSale.bill);
                ls.saveAccount(accountSale);
            }
            res.send({result: true, token: token});
        });
    // 03 (提出申请/申込) 的场合，起一个新的Contract，或者更新既存的Contract
    } else {

        var contractParams = [];
        bill.party1 = data.party1;
        bill.party2 = data.party2;
        bill.amount = data.amount;
        contractParams.push(data.party1);
        contractParams.push(bill.bill_no);
        contractParams.push(bill.bill_attr);
        contractParams.push(bill.bill_type);
        contractParams.push(bill.issuer_name);
        contractParams.push(bill.issuer_account);
        contractParams.push(bill.issuer_bank);
        contractParams.push(bill.custodian_name);
        contractParams.push(bill.custodian_account);
        contractParams.push(bill.custodian_bank);
        contractParams.push(bill.face_amount);
        contractParams.push(bill.acceptor_name);
        contractParams.push(bill.acceptor_account);
        contractParams.push(bill.acceptor_bank);
        contractParams.push(bill.issue_date);
        contractParams.push(bill.due_date);
        contractParams.push(bill.accept_date);
        contractParams.push(bill.pay_bank);
        contractParams.push(bill.trans_enable);
        contractParams.push(bill.party1);
        contractParams.push(bill.party2);
        contractParams.push(bill.amount);

        logger.info(contractParams);
        if (backFlg) {
            params.push('0');
        } else {
            params.push('1');
        }
        bc.invokeContract(null, 'invokeContract', contractParams, function (err, result) {
            if (err) {
                res.send({result: false, token: token, msg: "invoke contract failed.", err: JSON.stringify(err)});
                return;
            }
            bc.invokeSign(null, 'updateStatus', params, function (err, result) {
                if (err) {
                    res.send({
                        result: false,
                        token: token,
                        msg: "invoke sign failed.",
                        err: JSON.stringify(err)
                    });
                    return;
                }
                logger.info(result);
                bill.current_step = nextStep;
                ls.saveBill(bill);
                var account = ls.loadAccount('P1');
                logger.info(JSON.stringify(account));
                logger.info(account.bill + '+' + data.face_amount + '=>');
                account.bill = "" + ((account.bill * 1) + (bill.face_amount * 1));
                logger.info(account.bill);
                ls.saveAccount(account);
                res.send({result: true, token: token});
            });
        });
    }
});

/**
 * header: 'token
 * method: 'GET'
 * params: 'query.party'
 */
router.get('/account', function(req, res, next) {
  var decoded = {};
  var token = {};
  try {
      decoded = jwt.verify(req.header('token'), process.env.JWT_SECRET);
      token = jwt.sign(decoded, process.env.JWT_SECRET);
  } catch(err) {
      logger.info(err);
      res.send({err: err});
      return;
  }

  var data = req.query;
  if (data.party) {
    var account = ls.loadAccount(data.party);
    res.send({result: true, token: token, account: account});
    return;
  }

  res.send({result: false, token: token});
});

router.get('/mode', function(req, res, next) {
  res.send({mode: process.env.ENV_MODE});
});

router.post('/mode', function(req, res, next) {
  process.env.ENV_MODE = req.body['mode'];
  res.send({mode: process.env.ENV_MODE});
});

router.post('/reset', function(req, res, next) {
  ls.clearBill();
  res.send({bills: ls.loadBills()});
});

module.exports = router;
