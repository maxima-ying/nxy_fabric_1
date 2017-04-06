var fs = require('fs');
var path = require('path');
var async = require('async');
var logger = require('./log').Logger;
var LocalStore = require('./utils/LocalStore');
var BcRestApi = require('./utils/BlockChainHFCAPI');

//var serviceOpt = JSON.parse(fs.readFileSync(path.join(__dirname, 'credentails.json')));
var keyValStore = '/keyValStore';
if(!fs.existsSync(keyValStore)){
  fs.mkdirSync(keyValStore);
}

//var bc = new BcRestApi(serviceOpt, keyValStore);
var bc = new BcRestApi( keyValStore);


function getBCRestApi(){
  return bc;
}

function getMember(){
    return member;
}

function setMember(user){
    member = user;
}

function initPROD(callback) {
  process.env.JWT_SECRET = 'BlockChain'; // JWT认证秘钥
  process.env.ENV_MODE = "production";   // 0: local, 1: dev, 2: prod
  process.env.cashID = '000' + new Date().getTime(); // cash ID，唯一字符串
  var bill_no = '000' + new Date().getTime();

  //var user = serviceOpt.hfc.chaincode_user.user;
  //var affiliation = serviceOpt.hfc.chaincode_user.affiliation;

    logger.info('initPROD  ---start---');
    process.env['GOPATH'] = 'chaincode';

    var user = {
        enrollmentID: 'admin',
        enrollmentSecret: 'adminpw'
    };

    var chaincodeConfig = null;

  //LocalStore.clearBill();


/*
  bc.logonUser(user, affiliation, function(error, member){
      //TODO :这里的SKIP_DEPLOY_CHAINCODE　是怎么来的，还是不明白
    if(process.env.SKIP_DEPLOY_CHAINCODE) {
      var chaincodeConfig = LocalStore.loadChaincode();
      //2017/01/23 chaincode合并 start
      // if (chaincodeConfig.cash && chaincodeConfig.contract && chaincodeConfig.sign) {
      //   logger.info('Chaincode均已经被部署');
      //   logger.info(chaincodeConfig);
      //   var chaincodeHandlers = bc.getChaincodeHandlers();
      //   chaincodeHandlers['cash'] = chaincodeConfig.cash;
      //   chaincodeHandlers['contract'] = chaincodeConfig.contract;
      //   chaincodeHandlers['sign'] = chaincodeConfig.sign;
      //   return;
      // }
      if (chaincodeConfig.bill) {
          logger.info('Chaincode已经被部署');
          logger.info(chaincodeConfig);
          var chaincodeHandlers = bc.getChaincodeHandlers();
          chaincodeHandlers['bill'] = chaincodeConfig.bill;
          return;
      }
      //2017/01/23 chaincode合并 end
    }
    if(error){
      logger.error('注册用户%s失败。错误信息:%j', user, error);
      logger.error('程序退出');
      process.exit(1);
    }
*/




    async.series(
      {
        //2017/01/23 chaincode合并 start
        // 'initCash': function(callback){
        //   var deployTx1 = bc.initCash(member, ['P1', '10000000', 'P2', "10000000"]);
        //   LocalStore.saveAccount({party: 'P1', cash: '10000000', bill: '0'});
        //   LocalStore.saveAccount({party: 'P2', cash: '10000000', bill: '0'});
        //   deployTx1.on('submitted', function(result){
        //     callback(null, result);
        //   });
        //   deployTx1.on('error', function(error){
        //     callback(error);
        //   });
        // },
        // 'initContract': function(callback){
        //   var contractParams = [];
        //   // contractParams.push("party");
        //   // contractParams.push(bill_no);
        //   // contractParams.push("bill_attr");
        //   // contractParams.push("bill_type");
        //   // contractParams.push("issuer_name");
        //   // contractParams.push("issuer_account");
        //   // contractParams.push("issuer_bank");
        //   // contractParams.push("custodian_name");
        //   // contractParams.push("custodian_account");
        //   // contractParams.push("custodian_bank");
        //   // contractParams.push("face_amount");
        //   // contractParams.push("acceptor_name");
        //   // contractParams.push("acceptor_account");
        //   // contractParams.push("acceptor_bank");
        //   // contractParams.push("issue_date");
        //   // contractParams.push("due_date");
        //   // contractParams.push("accept_date");
        //   // contractParams.push("pay_bank");
        //   // contractParams.push("trans_enable");
        //   // contractParams.push("party1");
        //   // contractParams.push("party2");
        //   // contractParams.push("amount");
        //   var deployTx2 = bc.initContract(member, contractParams);
        //   deployTx2.on('submitted', function(result){
        //     callback(null, result);
        //   });
        //   deployTx2.on('error', function(error){
        //     callback(error);
        //   });
        // },
        // 'initSign': function(callback){
        //   var deployTx3 = bc.initSign(member, [bill_no]);
        //   deployTx3.on('submitted', function(result){
        //     callback(null, result);
        //   });
        //   deployTx3.on('error', function(error){
        //     callback(error);
        //   });
        // }
          'loginUser':function(callback){
              bc.logonUser(user,  function(error, res) {
                  try {
                      chaincodeConfig = LocalStore.loadChaincode();
                  } catch (err) {
                      logger.info(err);
                  }

                  if (chaincodeConfig.bill) {
                      logger.info('Chaincode已经被部署');
                      logger.info(chaincodeConfig);
                      var chaincodeHandlers = bc.getChaincodeHandlers();
                      chaincodeHandlers['bill'] = chaincodeConfig.bill;
                      //这里不callback,后面createChannel和deploy就不会做,也不用return
                      bc.initialize_chain(function(msg){
                          logger.info('initialize_chain call back: ' + msg);
                      });
                      //return;
                  }else {
                      if (error) {
                          logger.error('注册用户%s失败。错误信息:%j', user.enrollmentID, error);
                          logger.error('程序退出');
                          process.exit(1);
                      }
                      else {
                          logger.info('用户成功登录%s', user.enrollmentID);

                          member = res;
                          setMember(res);
                          callback(null, member);
                      }
                  }
              });
          },
/*
          //TODO：临时加一下debug start
          'initBill': function(callback){
              var deployTx1 = bc.initBill(member, ['P1', '10000000', 'P2', "10000000"]);
              LocalStore.saveAccount({party: 'P1', cash: '10000000', bill: '0'});
              LocalStore.saveAccount({party: 'P2', cash: '10000000', bill: '0'});
              deployTx1.on('submitted', function(result){
                  callback(null, result);
              });
              deployTx1.on('error', function(error){
                  callback(error);
              });
          },
          //TODO：临时加一下debug end
*/
          'createChannel':function(callback){
              bc.create_Channel(function(error, res) {
                  if (error) {
                      logger.error('create_Channel失败。');
                      logger.error('继续执行');//TODO：如何判断channel是否存在？
                      //logger.error('程序退出');
                      //process.exit(1);
                      callback(null, member);
                  }
                  else {
                      logger.info('create_Channel成功。');
                      callback(null, member);
                  }
              });
          },
          'joinChannel':function(callback){
              bc.join_Channel(member, function(error, res) {
                  if (error) {
                      logger.error('join_Channel失败。');
                      logger.error('继续执行');//TODO：如何判断channel是否已经join？
                      //logger.error('程序退出');
                      //process.exit(1);
                      callback(null, member);
                  }
                  else {
                      logger.info('join_Channel成功。');
                      callback(null, member);
                  }
              });
          },

        'installProposal':function(callback){
            logger.info('installProposal开始。');
            bc.install_Proposal(member, 'bill', function(err,result) {
                if (err) {
                    callback(err);
                    logger.error('installProposal失败。');
                }
                else {
                    callback(null, result);
                    logger.info('installProposal成功。');
                }
            });
        },
            /*
        'instantiateProposal':function(callback){
            bc.instantiate_Proposal(member, 'bill', functionName, args ,function(err,result) {
                //member, chaincode, functionName, args ,callback) {
                if (err) {
                    callback(err);
                    logger.error('instantiateProposal失败。');
                }
                else {
                    callback(null, result);
                    logger.info('instantiateProposal成功。');
                }
            });
        },
        //最后保存chaincode, 下次就不用再ｄｅｐｌｏｙ了
        'savechaincode':function(){
            var chaincodeData = LocalStore.loadChaincode();
            chaincodeData[chaincode] = chaincode_id;
            LocalStore.saveChaincode(chaincodeData);
            logger.info("chaincode saved. ---------------")
        }
*/


        'initBill': function(callback){
            var deployTx1 = bc.initBill(member, ['P1', '10000000', 'P2', "10000000"],function(err,result) {
                if (err) {
                    callback(err);
                    logger.error('initBill失败。');
                }
                else {
                    callback(null, result);
                    logger.info('initBill成功。');
                    //清空本地的BC历史数据
                    LocalStore.clearBill();
                }
            });
            LocalStore.saveAccount({party: 'P1', cash: '10000000', bill: '0'});
            LocalStore.saveAccount({party: 'P2', cash: '10000000', bill: '0'});

            //TODO need to modify
//            deployTx1.on('submitted', function(result){
//                callback(null, result);
//            });
//            deployTx1.on('error', function(error){
//                callback(error);
//            });
        }

        //2017/01/23 chaincode合并 end
      }, function(err, data) {
        if(err){
          logger.error('未能部署chaincode。错误信息：%j', err);
          process.exit(1);
        }
        logger.info('部署执行结果:%j', data);
      }
    );

}

module.exports.getMember = getMember;
module.exports.getBCRestApi = getBCRestApi;
module.exports.initPROD = initPROD;
