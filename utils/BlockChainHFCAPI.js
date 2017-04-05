//var hfc=require('hfc');
var LocalStore = require('./LocalStore');
var logger = require('../log').Logger;

// 1.0 alpha added
var hfc = require('../fabric-client');
var utils = require('../fabric-client/lib/utils.js');
var Peer = require('../fabric-client/lib/Peer.js');
var Orderer = require('../fabric-client/lib/Orderer.js');
var EventHub = require('../fabric-client/lib/EventHub.js');
var User = require('../fabric-client/lib/User.js');
var copService = require('../fabric-client/lib/FabricCAClientImpl.js');
var fs = require('fs');
var grpc = require('grpc');
var async = require('async');

//var CHAIN_NAME = 'bc_nxy_chain';

//不换个名字或者加个版本号，新的chaincode也不会重新编译哟
//var chaincode_id = 'myexccc1';
//var chaincode_id = 'nxycc1';
var chaincode_id = 'bill';
var chaincode_version = '1.0';


//其实这个是channel_ID
var chain_id = 'mychannel';
//TODO: 如果要换成 bc_nxy_chain， 需要重新跑 configtx，生成一个 xx.tx 来替换mychannel.tx
//var chain_id = 'bc_nxy_chain';

//var chaincode_path = 'github.com/example_cc';
var chaincode_path = 'bill';
//var chaincode_path = 'bill2';
var ORGS = hfc.getConfigSetting('test-network');

/*
var printNetworkDetails = function(peerUrls, caUrl) {
  logger.info("\n------------- ca-server, peers URL:PORT information: -------------");
  logger.info("\nCA server Url : %s\n", caUrl);
  for (var i = 0; i < peerUrls.length; i++) {
    logger.info("Validating Peer%d : %s", i, peerUrls[i]);
  }
  logger.info("");
  // for (var i = 0; i < eventUrls.length; i++) {
  //   logger.info("Event Url on Peer%d : %s", i, eventUrls[i]);
  // }
  // logger.info("");
  logger.info('-----------------------------------------------------------\n');
}
*/

//var bcHFCAPI = function(credentials, keyValueStorePath){
var bcHFCAPI = function(keyValueStorePath){

    logger.info('bcHFCAPI  ---start---');

    var _bcHFCAPI = {};

    /*
  var chain = hfc.newChain(CHAIN_NAME);
  chain.setKeyValStore(hfc.newFileKeyValStore(keyValueStorePath));
  chain.setDeployWaitTime(5);
  chain.setInvokeWaitTime(3);


  // 节点信息
  var peers = credentials.peers;

  var peerUrl = [];
  for(var i = 0; i < peers.length; i++){
    peerUrl[i] = 'grpc://' + peers[i].discovery_host + ':' + peers[i].discovery_port;
    chain.addPeer(peerUrl[i], {});
  }

*/
    //主入口app.js的相对路径
    hfc.addConfigFile('./data/config.json');
    var ORGS = hfc.getConfigSetting('test-network');
    logger.info('ORGS ：' + JSON.stringify(ORGS));
    var org = ORGS.org1.name;
    logger.info('org ：' + JSON.stringify(org));

    var client = new hfc();

    var chain = client.newChain(chain_id);
    chain.addOrderer(new Orderer('grpc://localhost:7050'));
    //TODO because docker-compose.yml
    // chain.addPeer(new Peer('grpc://localhost:7056'));
    chain.addPeer(new Peer('grpc://localhost:7051'));

    var targets = [];
    //TODO because docker-compose.yml
    // targets.push(new Peer('grpc://localhost:7056'));
    targets.push(new Peer('grpc://localhost:7051'));

    var eventhubs = [];
    var eh1 = new EventHub();
    eh1.setPeerAddr('grpc://localhost:7053');
    eventhubs.push(eh1);

    //TODO because docker-compose.yml
    // var eh2 = new EventHub();
    // eh2.setPeerAddr('grpc://localhost:7058');
    // eventhubs.push(eh2);

    var tx_id = null;
    var nonce = null;
    var the_user = null;

    var _commonProto = grpc.load('./fabric-client/lib/protos/common/common.proto').common;

    /*
  // 认证信息
  var ca = credentials.ca;
  var caUrl = null;
  if(ca){
    var network_id = Object.keys(ca);
    if(network_id.length > 0 ){
      var caHost = ca[network_id[0]].discovery_host;
      var caPort = ca[network_id[0]].discovery_port;
      caUrl = 'grpc://' + caHost + ':' + caPort;
      chain.setMemberServicesUrl(caUrl, {});
    }
  }

  printNetworkDetails(peerUrl, caUrl);


  // 系统管理员用户名
  var registarUser = credentials.hfc.registar.user;
  // 系统管理员密码
  var registarPassword = credentials.hfc.registar.password;

  var chaincodeHandlers = new Object();

  var _bcHFCAPI = {};
*/

/*
  var logonUser = function(user, affiliation, callback) {
    chain.enroll(registarUser, registarPassword, function(err, admin) {
      if(err){
        logger.error('登录管理员用户%s，密码%s时候出错', registarUser, registarPassword);
        logger.error(err);
        callback(err);
      }else {
        logger.info('管理员用户%s登录成功', registarUser);
        chain.setRegistrar(admin);
        var registrationRequest = {
          enrollmentID: user,
          affiliation: affiliation
        };
        chain.registerAndEnroll(registrationRequest, function(err, member) {
          if(err){
            logger.error('登录用户时候出错。登录请求=%j', user, registrationRequest);
            logger.error(err);
            callback(err);
          }else {
            logger.info('注册用户%s成功', user);
            callback(null, member);
          }
        });
      }
    });
  };
*/

    var logonUser = function(user, callback) {

        logger.info('path:'+ '/tmp/hfc-test-kvs_'+ org);
        //kvs
        hfc.newDefaultKeyValueStore({
            path: '/tmp/hfc-test-kvs_'+ org
        }).then(function(store){
            client.setStateStore(store);
            logger.info('setStateStore---return');
            client.getUserContext(user.enrollmentID)
                .then(function(user){
                    logger.info('getUserContext---return');
                    if (user && user.isEnrolled()) {
                        logger.info('Successfully loaded member from persistence');
                        // return user;
                        callback(null, user);
                    }
                    else{
                        logger.info('user.isEnrolled() == false');
                    }

                    var cop = new copService('http://localhost:7054');
                    var member;
                    cop.enroll({
                        enrollmentID: 'admin',
                        enrollmentSecret: 'adminpw'
                    }).then(function(enrollment){
                        logger.info('Successfully enrolled user \'' + 'admin' + '\'');
                        member = new User('admin', client);
                        logger.info('new user');
                        return member.setEnrollment(enrollment.key, enrollment.certificate);
                    }).then(function(){
                        logger.info('client setUserContext member--C:\tmp\hfc-test-kvs_peerOrg1 create file admin');
                        return client.setUserContext(member);
                    }).then(function(){
                        logger.info('return member');
                        callback(null, member);
                    });
                });

        });
    };

    var create_Channel = function(callback) {
        logger.info('createChannel-------start---------');
        var request = null;

        //TODO how to creat mychannel.tx
        fs.readFile('./docker/mychannel.tx', function(err, data) {
            if (err) {
                logger.error('readFile error: ' + err.stack ? err.stack : err);
                callback('readFile error: ' + err.stack ? err.stack : err);
            } else {
                // logger.info('mychannel.tx data:'+data.toString());

                var request = {
                    envelope : data
                };
                // send to orderer
                chain.createChannel(request)
                    .then(function(response){
                        logger.info(' response :',response);
                        if (response && response.status === 'SUCCESS') {
                            logger.info('Successfully created the channel.');
                            sleep(5000)
                                .then(function(nothing){
                                    logger.info('Successfully created the channel and then wait 5 s.');
                                    callback(null,null);
                                },function(err){
                                    logger.error('Failed to sleep due to error: ' + err.stack ? err.stack : err);
                                    callback('Failed to sleep due to error: ' + err.stack ? err.stack : err, null);
                                });
                        } else {
                            logger.error('Failed to create the channel. ');
                            callback('Failed to create the channel. ');
                        }
                    },function(err){
                        logger.error('createChannel error. ' + err.stack ? err.stack : err);
                        callback('Failed to create the channel. ');
                    });
            }
        });

    };

    var join_Channel = function(member, callback) {
        logger.info('join_Channel-------start---------');

        the_user = member;
        the_user.mspImpl._id = 'Org1MSP'; //see config.json

        nonce = utils.getNonce();
        tx_id = chain.buildTransactionID(nonce, the_user);
        logger.info('join_Channel tx_id : ' + tx_id);
        logger.info('join_Channel nonce : ' + nonce);
        var request = {
            targets : targets,
            txId : 	tx_id,
            nonce : nonce
        };

        var eventPromises = [];
        eventhubs.forEach(function(eh){
            // if (eh.connected() === false) {
            eh.connect();
            logger.info('event connect.');
            // }
            let txPromise = new Promise(function(resolve, reject){
                // let handle = setTimeout(reject, 30000);
                let handle = setTimeout(reject, 90000);
                eh.registerBlockEvent(function(block){
                    clearTimeout(handle);

                    logger.info('block.data.data.length : ' + block.data.data.length);
                    // in real-world situations, a peer may have more than one channels so
                    // we must check that this block came from the channel we asked the peer to join
                    if(block.data.data.length === 1) {
                        // Config block must only contain one transaction
                        var envelope = _commonProto.Envelope.decode(block.data.data[0]);
                        var payload = _commonProto.Payload.decode(envelope.payload);
                        logger.info('block.data.data[0].payload : ' + payload);
                        var channel_header = _commonProto.ChannelHeader.decode(payload.header.channel_header);
                        logger.info('block.data.data[0].payload.header.channel_header.channel_id : ' + channel_header.channel_id);

                        if (channel_header.channel_id === 'mychannel') {
                            logger.info('The new channel has been successfully joined on peer '+ eh.ep.addr);
                            resolve();
                        }
                    }
                    else {
                        logger.info('block.data.data.length : '+block.data.data.length);
                        reject();
                    }
                });
            });

            eventPromises.push(txPromise);
        });

        var sendPromise = chain.joinChannel(request);
        Promise.all([sendPromise].concat(eventPromises))
            .then(function(results){
                eventhubs.forEach(function(eh) {
                    // if (eh.connected() === true) {
                    eh.disconnect();
                    logger.info('event disconnect.');
                    // }
                });
                if(results[0] && results[0][0] && results[0][0].response && results[0][0].response.status === 200) {
                    logger.info('Successfully joined peers in organization %s to join the channel');
                    callback(null, the_user);
                } else {
                    logger.error(' Failed to join channel');
                    callback('Failed to join channel');
                }
            });
    };

//1.0_alpha变为 install + instantiate, 所以这个不要了
/*
  var deployChaincode = function(member, chaincode, functionName, args, callback){
    // Construct the deploy request
    var deployRequest = {
      // Function to trigger
      fcn: functionName,
      // Arguments to the initializing function
      args: args,
      // Chaincode Path
      chaincodePath: chaincode
    };

    // Trigger the deploy transaction
    var deployTx = member.deploy(deployRequest);

    // Print the deploy results
    deployTx.on('submitted', function(results) {
      logger.info('部署要求已经被提交：request=%j, response=%j。', deployRequest, results);
    });
    // Print the deploy results
    deployTx.on('complete', function(results) {
      // Deploy request completed successfully
      var chaincodeID = results.chaincodeID;
      var chaincodeData = LocalStore.loadChaincode();
      chaincodeData[chaincode] = chaincodeID;
      LocalStore.saveChaincode(chaincodeData);
      // 缓存chaincode，不论本地文件是否是旧文件，都代表已经部署过一遍该Chaincode
      chaincodeHandlers[chaincode] = chaincodeID;

      logger.info('部署要求已经被写入区块：request=%j, response=%j。', deployRequest, results);
      logger.info('%s.ChaincodeID=%s', chaincode, chaincodeID);
      if(callback) {
        callback(null, results);
      }
    });
    deployTx.on('error', function(err) {
      // Deploy request failed
      // console.log(util.format("\nFailed to deploy chaincode: request=%j, error=%j", deployRequest, err));
      logger.error('部署失败。是不是没有/tmp文件夹？？ request=%j,error=%j', deployRequest, err);
      if(callback) {
        callback(err);
      }
    });
    return deployTx;
  };
*/
    // 先做个壳子
    var deployChaincode = function(member, chaincode, functionName, args, callback) {
        logger.info("deployChaincode ---- start ------")

        instantiate_Proposal(member, chaincode, functionName, args ,function(err,result) {
            //member, chaincode, functionName, args ,callback) {
            if (err) {
                callback(err);
            }
            else {
                callback(null, result);
            }
        });

        /*
        async.series(
            {
                'installProposal':function(callback){
                    install_Proposal(member, chaincode, function(err,result) {
                        if (err) {
                            callback(err);
                        }
                        else {
                            callback(null, result);
                        }
                    });
                },
                'instantiateProposal':function(callback){
                    instantiate_Proposal(member, chaincode, functionName, args ,function(err,result) {
                        //member, chaincode, functionName, args ,callback) {
                        if (err) {
                            callback(err);
                        }
                        else {
                            callback(null, result);
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
            });

         */
/*
        install_Proposal(member, chaincode, function(err,result) {
            if (err) {
                callback(err);
            }
            else {
                callback(null, result);
            }
//        })
            //TODO : warning
        }).then(function(member, chaincode, functionName, args){
            instantiate_Proposal(member, chaincode, functionName, args ,function(err,result) {
                //member, chaincode, functionName, args ,callback) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, result);
                }
                //最后保存chaincode, 下次就不用再ｄｅｐｌｏｙ了
            }, function(err){
                logger.error('install_Proposal error');
                //callback(err);
            })
        }).then(function(chaincode){
            var chaincodeData = LocalStore.loadChaincode();
            chaincodeData[chaincode] = chaincode_id;
            LocalStore.saveChaincode(chaincodeData);
        });
*/
        logger.info("deployChaincode ---- end ------")
    }

    var install_Proposal = function(member, chaincode, callback) {

        logger.info('installProposal-------start---------');

        the_user = member;
        the_user.mspImpl._id = 'Org1MSP'; //see config.json

        nonce = utils.getNonce();
        tx_id = chain.buildTransactionID(nonce, the_user);
        logger.info('create tx_id：' + tx_id);

        // send proposal to endorser
        var request = {
            targets: targets,
            chaincodePath: chaincode_path,
            //chaincodePath: chaincode,
            chaincodeId: chaincode_id,
            chaincodeVersion: chaincode_version,
            txId: tx_id,
            nonce: nonce,
            chaincodeType: 'golang'   //golang or car (default:golang)
        };
        logger.info('installProposal----chaincodePath:'+ request.chaincodePath + ' -----  chaincode_id: ' + request.chaincodeId + ' -----  chaincodeVersion: ' + request.chaincodeVersion);
        chain.sendInstallProposal(request)
            .then(function(results){
                var proposalResponses = results[0];
                var proposal = results[1];
                var header   = results[2];

                if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
                    logger.info('Successfully sent install Proposal and received ProposalResponse: Status - '+ proposalResponses[0].response.status);
                    callback(null, the_user);
                } else {
                    logger.error('install proposal was bad');
                    callback('install proposal was bad');
                }
            });

        logger.info('installProposal-------end---------');
    };

    // TODO:这里传参 chaincode 和 全局变量 chaincode_path 重复,暂时没用上
    var instantiate_Proposal = function(member, chaincode, functionName, args ,callback) {
        logger.info('instantiateProposal-------start---------');

        the_user = member;
        the_user.mspImpl._id = 'Org1MSP'; //see config.json

        // read the config block from the orderer for the chain
        // and initialize the verify MSPs based on the participating
        // organizations
        chain.initialize()
            .then(function(success){
                nonce = utils.getNonce();
                tx_id = chain.buildTransactionID(nonce, the_user);

                // send proposal to endorser
                var request = {
                    chaincodePath:  chaincode_path,
                    //chaincodePath:  chaincode,
                    chaincodeId: chaincode_id,
                    chaincodeVersion: chaincode_version,
                    //fcn: 'init',
                    fcn: functionName,
                    //args: ['a', '100', 'b', '200'],
                    args: args,
                    chainId: chain_id,
                    txId: tx_id,
                    nonce: nonce
                };

                logger.info('instantiate proposal----chaincodePath:'+ request.chaincodePath + ' -----  chaincode_id: ' + request.chaincodeId + ' -----  chaincodeVersion: ' + request.chaincodeVersion);
                logger.info('instantiate proposal----args:'+ args);
                chain.sendInstantiateProposal(request)
                    .then(function(results){
                        var proposalResponses = results[0];
                        var proposal = results[1];
                        var header   = results[2];
                        if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
                            logger.info('Successfully sent Proposal and received ProposalResponse:'
                                +' Status - '+proposalResponses[0].response.status
                                +' message - '+proposalResponses[0].response.message
                                +', metadata - '+proposalResponses[0].response.payload
                                +', endorsement signature: '+proposalResponses[0].endorsement.signature);

                            var request = {
                                proposalResponses: proposalResponses,
                                proposal: proposal,
                                header: header
                            };
                            var deployId = tx_id.toString();  //eventhub 用

                            // var eventPromises2 = [];
                            // eventhubs.forEach(function(eh){
                            //     // if(eh.connected()===false){
                            //         eh.connect();
                            //         logger.info('event connect.');
                            //     // }
                            //     let txPromise = new Promise(function(resolve, reject){
                            //             let handle = setTimeout(reject, 30000);
                            //         eh.registerTxEvent(deployId.toString(), function(tx, code){
                            //             logger.info('The chaincode instantiate transaction has been committed on peer '+ eh.ep.addr);
                            //             clearTimeout(handle);
                            //             eh.unregisterTxEvent(deployId);
                            //
                            //             if (code !== 'VALID') {
                            //                 logger.error('The chaincode instantiate transaction was invalid, code = ' + code);
                            //                 reject();
                            //             } else {
                            //                 logger.info('The chaincode instantiate transaction was valid.');
                            //                 resolve();
                            //             }
                            //         });
                            //      });
                            //     eventPromises2.push(txPromise);
                            // });

                            logger.info('chain.sendTransaction start.');
                            var sendPromise2 = chain.sendTransaction(request);
                            // Promise.all([sendPromise2].concat(eventPromises2))
                            Promise.all([sendPromise2])
                                .then(function(results){
                                    //logger.info('sendTransaction results[0]:' + results[0]);
                                    logger.info('sendTransaction results[0]:' + results[0].status);
                                    var response2 =  results[0];

                                    // eventhubs.forEach(function(eh) {
                                    //     // if (eh.connected() === true) {
                                    //     eh.disconnect();
                                    //     logger.info('event disconnect.');
                                    //     // }
                                    // });
                                    if (response2.status === 'SUCCESS') {
                                        logger.info('Successfully sent instantiate transaction to the orderer.');
                                        callback(null, response2);
                                    } else {
                                        logger.error('Failed to order the instantiate endorsement. Error code: ' + response2.status);
                                        callback('Failed to order the instantiate endorsement. Error code: ' + response2.status);
                                    }

                                }).catch(function(err){
                                logger.error('sendTransaction eventPromises error: ' + err);
                                callback('sendTransaction eventPromises error. ');
                            });
                            // .then(function(response){
                            //     eventhubs.forEach(function(eh) {
                            //         // if (eh.connected() === true) {
                            //             eh.disconnect();
                            //             logger.info('event disconnect.');
                            //         // }
                            //     });
                            //     if (response.status === 'SUCCESS') {
                            //         logger.info('Successfully sent instantiate transaction to the orderer.');
                            //         callback(null, response);
                            //     } else {
                            //         logger.error('Failed to order the instantiate endorsement. Error code: ' + response.status);
                            //         callback('Failed to order the instantiate endorsement. Error code: ' + response.status);
                            //     }
                            // });
                        } else {
                            logger.error('instantiate proposal was bad');
                            callback('instantiate proposal was bad');
                        }
                    });
            },function(err){
                logger.error('chain initialize() error');
                callback('chain initialize() error');
            });
    };

/*
    var invokeChaincode = function(member, chaincode, functionName, args, callback){
        if(chaincodeHandlers[chaincode]==null){
            throw new Error(chaincode + '未部署');
        }
        // Construct the invoke request
        var invokeRequest = {
          // Name (hash) required for invoke
          chaincodeID: chaincodeHandlers[chaincode],
          // Function to trigger
          fcn: functionName,
          // Parameters for the invoke function
          args: args
        };

        // Trigger the invoke transaction
        var invokeTx = member.invoke(invokeRequest);

        // Print the invoke results
        invokeTx.on('submitted', function(results) {
            // Invoke transaction submitted successfully
            logger.info('执行事务要求已经被提交：request=%j, response=%j。', invokeRequest, results);
        });
        invokeTx.on('complete', function(results) {
            // Invoke transaction completed successfully
            logger.info('执行事务要求已经被写入区块链：request=%j, response=%j。', invokeRequest, results);
            if(callback) {
                callback(null, results);
            }
        });
        invokeTx.on('error', function(err) {
            // Invoke transaction submission failed
            logger.error('执行事务时出错：request=%j, err=%j。', invokeRequest, err);
            if(callback) {
                callback(err);
            }
        });
        return invokeTx;
    };
*/
    // 做成跟原来一样的接口
    var invokeChaincode = function(member, chaincode, functionName, args, callback) {
        logger.info('invokeChaincode-------start---------');
        logger.info('invokeChaincode wait 30 s.');


        the_user = member;
        the_user.mspImpl._id = 'Org1MSP'; //see config.json

        nonce = utils.getNonce();
        tx_id = chain.buildTransactionID(nonce, the_user);

        // send query
        var request = {
            chaincodeId : chaincode,
            chaincodeVersion : chaincode_version,
            chainId: chain_id,
            txId: tx_id,
            nonce: nonce,
            fcn: functionName,
            args: args
        };
        //chain.sendInstantiateProposal(request)
        var invokeTx = chain.sendTransactionProposal(request)
            .then(function(results){
                var proposalResponses = results[0];
                var proposal = results[1];
                var header   = results[2];
                if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
                    logger.info('Successfully sent Proposal and received ProposalResponse:'
                        +' Status - '+proposalResponses[0].response.status
                        +' message - '+proposalResponses[0].response.message
                        +', metadata - '+proposalResponses[0].response.payload
                        +', endorsement signature: '+proposalResponses[0].endorsement.signature);

                    var request = {
                        proposalResponses: proposalResponses,
                        proposal: proposal,
                        header: header
                    };
                    var deployId = tx_id.toString();  //eventhub 用

                    logger.info('chain.sendTransaction start.');
                    var sendPromise2 = chain.sendTransaction(request);
                    // Promise.all([sendPromise2].concat(eventPromises2))
                    Promise.all([sendPromise2])
                        .then(function(results){
                            logger.info('sendTransaction results[0]:' + results[0]);
                            var response2 =  results[0];

                            if (response2.status === 'SUCCESS') {
                                logger.info('Successfully sent instantiate transaction to the orderer.');
                                callback(null, response2);
                            } else {
                                logger.error('Failed to order the instantiate endorsement. Error code: ' + response2.status);
                                callback('Failed to order the instantiate endorsement. Error code: ' + response2.status);
                            }

                        }).catch(function(err){
                        logger.error('sendTransaction eventPromises error: ' + err);
                        callback('sendTransaction eventPromises error. ');
                    });
                } else {
                    logger.error('instantiate proposal was bad');
                    callback('instantiate proposal was bad');
                }
            });
    };

    // 验证用的方法，来自test_hfc
    var invoke_by_chaincode = function(member, callback) {
        logger.info('invoke_by_chaincode-------start---------');
        sleep(30000).then(function(nothing){
            logger.info('invoke_by_chaincode wait 30 s.');


            the_user = member;
            the_user.mspImpl._id = 'Org1MSP'; //see config.json

            nonce = utils.getNonce();
            tx_id = chain.buildTransactionID(nonce, the_user);

            // send query
            var request = {
                chaincodeId : chaincode_id,
                chaincodeVersion : chaincode_version,
                chainId: chain_id,
                txId: tx_id,
                nonce: nonce,
                fcn: 'transfer',
                //args: ['move','a','b',"5"]
                args: ['P1','P2','5']
            };
            //chain.sendInstantiateProposal(request)
            chain.sendTransactionProposal(request)
                .then(function(results){
                    var proposalResponses = results[0];
                    var proposal = results[1];
                    var header   = results[2];
                    if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
                        logger.info('Successfully sent Proposal and received ProposalResponse:'
                            +' Status - '+proposalResponses[0].response.status
                            +' message - '+proposalResponses[0].response.message
                            +', metadata - '+proposalResponses[0].response.payload
                            +', endorsement signature: '+proposalResponses[0].endorsement.signature);

                        var request = {
                            proposalResponses: proposalResponses,
                            proposal: proposal,
                            header: header
                        };
                        var deployId = tx_id.toString();  //eventhub 用

                        logger.info('chain.sendTransaction start.');
                        var sendPromise2 = chain.sendTransaction(request);
                        // Promise.all([sendPromise2].concat(eventPromises2))
                        Promise.all([sendPromise2])
                            .then(function(results){
                                logger.info('sendTransaction results[0]:' + results[0]);
                                var response2 =  results[0];

                                if (response2.status === 'SUCCESS') {
                                    logger.info('Successfully sent instantiate transaction to the orderer.');
                                    callback(null, response2);
                                } else {
                                    logger.error('Failed to order the instantiate endorsement. Error code: ' + response2.status);
                                    callback('Failed to order the instantiate endorsement. Error code: ' + response2.status);
                                }

                            }).catch(function(err){
                            logger.error('sendTransaction eventPromises error: ' + err);
                            callback('sendTransaction eventPromises error. ');
                        });
                    } else {
                        logger.error('instantiate proposal was bad');
                        callback('instantiate proposal was bad');
                    }
                });


            // callback(null,null);
        },function(err){
            logger.error('Failed to sleep due to error: ' + err.stack ? err.stack : err);
            callback('Failed to sleep due to error: ' + err.stack ? err.stack : err, null);
        });
    };

    var getMember = function(member){
        if(!member){
            //TODO : 运行出错，临时修改一下。关于member这块，不是很明白。
            //return chain.getRegistrar();
            return the_user;

        }
        else if(typeof member == 'string'){
            return chain.getMember(member);
        }else{
            return member;
        }
    }

    //2017/01/23 chaincode合并 start
    // var initCash = function(member, args, callback){
    //     member = getMember(member);
    //     logger.info('正在部署cash');
    //     return deployChaincode(member, 'cash', 'initCash', args, callback);
    // };
    //
    //
    // var initContract = function(member, args, callback){
    //     member = getMember(member);
    //     logger.info('正在部署contract');
    //     return deployChaincode(member, 'contract', 'initContract', args, callback);
    // };
    //
    // var initSign = function(member, args, callback){
    //     member = getMember(member);
    //     logger.info('正在部署sign');
    //     return deployChaincode(member, 'sign', 'initSign', args, callback);
    // };

    var initBill = function(member, args, callback){
        member = getMember(member);
        logger.info('正在部署bill');
        return deployChaincode(member, 'bill', 'initBill', args, callback);
    };
    //2017/01/23 chaincode合并 end

    var invokeSign = function(member, functionName, args, callback) {
        member = getMember(member);

        //2017/01/23 chaincode合并 start
        // return invokeChaincode(member,'sign', functionName, args, callback);
        return invokeChaincode(member,'bill', functionName, args, callback);
        //2017/01/23 chaincode合并 end
    };

    var invokeContract = function(member, functionName, args, callback){
        member = getMember(member);

        //2017/01/23 chaincode合并 start
        // return invokeChaincode(member,'contract', functionName, args, callback);
        return invokeChaincode(member,'bill', functionName, args, callback);
        //2017/01/23 chaincode合并 end
    };

    var invokeCash = function(member, functionName, args, callback){
        member = getMember(member);

        //2017/01/23 chaincode合并 start
        // return invokeChaincode(member,'cash', functionName, args, callback);
        return invokeChaincode(member,'bill', functionName, args, callback);
        //2017/01/23 chaincode合并 end
    };

    function sleep(ms) {
        return new Promise(function(resolve){setTimeout(resolve, ms)});
    };

    //TODO:
    var queryChaincode = function(member, chaincode, functionName, args, callback) {
        logger.info('query_by_chaincode-------start---------');
        sleep(30000).then(function(nothing){
            logger.info('query_by_chaincode wait 30 s.');


            the_user = member;
            the_user.mspImpl._id = 'Org1MSP'; //see config.json

            nonce = utils.getNonce();
            tx_id = chain.buildTransactionID(nonce, the_user);

            //str_fcn = 'queryAccount';
            //str_args = 'P1';

            // send query
            var request = {
                chaincodeId : chaincode_id,
                chaincodeVersion : chaincode_version,
                chainId: chain_id,
                txId: tx_id,
                nonce: nonce,
                fcn: functionName,
                //args: ['query','b']
                args: args
            };
            logger.info('query----chaincodePath:' + ' -----  chaincode_id: ' + request.chaincodeId + ' -----  chaincodeVersion: ' + request.chaincodeVersion);
            logger.info('query----fcn:' +  request.fcn+ ' -----  args: ' + request.args );
            chain.queryByChaincode(request)
                .then(function(response_payloads){
                    if (response_payloads) {
                        for(let i = 0; i < response_payloads.length; i++) {
                            // t.equal(response_payloads[i].toString('utf8'),'300','checking query results are correct that user b has 300 now after the move');
                            logger.info('query response_payloads:' + response_payloads[i].toString('utf8'));
                        }
                        callback(null,response_payloads[0].toString('utf8'));
                    } else {
                        logger.error('response_payloads is null');
                        callback('response_payloads is null');
                    }
                },function(err){
                    logger.error('chain query error');
                    callback('chain query error');
                });


            // callback(null,null);
        },function(err){
            logger.error('Failed to sleep due to error: ' + err.stack ? err.stack : err);
            callback('Failed to sleep due to error: ' + err.stack ? err.stack : err, null);
        });
    };



    //TODO: debug
    var query_by_chaincode = function(member, callback) {
        logger.info('query_by_chaincode-------start---------');
        sleep(30000).then(function(nothing){
            logger.info('query_by_chaincode wait 30 s.');


            the_user = member;
            the_user.mspImpl._id = 'Org1MSP'; //see config.json

            nonce = utils.getNonce();
            tx_id = chain.buildTransactionID(nonce, the_user);

            str_fcn = 'queryAccount';
            str_args = 'P1';

            // send query
            var request = {
                chaincodeId : chaincode_id,
                chaincodeVersion : chaincode_version,
                chainId: chain_id,
                txId: tx_id,
                nonce: nonce,
                fcn: 'queryAccount',
                //args: ['query','b']
                args: [ 'P1']
            };
            logger.info('query----chaincodePath:' + ' -----  chaincode_id: ' + request.chaincodeId + ' -----  chaincodeVersion: ' + request.chaincodeVersion);
            logger.info('query----fcn:' +  request.fcn+ ' -----  args: ' + request.args );
            chain.queryByChaincode(request)
                .then(function(response_payloads){
                    if (response_payloads) {
                        for(let i = 0; i < response_payloads.length; i++) {
                            // t.equal(response_payloads[i].toString('utf8'),'300','checking query results are correct that user b has 300 now after the move');
                            logger.info('query response_payloads:' + response_payloads[i].toString('utf8'));
                        }
                        callback(null,response_payloads[0].toString('utf8'));
                    } else {
                        logger.error('response_payloads is null');
                        callback('response_payloads is null');
                    }
                },function(err){
                    logger.error('chain query error');
                    callback('chain query error');
                });


            // callback(null,null);
        },function(err){
            logger.error('Failed to sleep due to error: ' + err.stack ? err.stack : err);
            callback('Failed to sleep due to error: ' + err.stack ? err.stack : err, null);
        });
    };

    var chaincode_query = function(member, callback){
        return query_by_chaincode(member, function(err,result){
            if(err){
                callback(err);
            }
            else{
                callback(null,result);
            }
        });
    };

    var chaincode_invoke = function(member, callback){
        return invoke_by_chaincode(member, function(err,result){
            if(err){
                callback(err);
            }
            else{
                callback(null,result);
            }
        });
    };


    //restful test api
    _bcHFCAPI.chaincode_query = chaincode_query;
    _bcHFCAPI.chaincode_invoke = chaincode_invoke;

    //---------------------------------------------------------------------'

    _bcHFCAPI.create_Channel = create_Channel;
    _bcHFCAPI.join_Channel = join_Channel;
    _bcHFCAPI.install_Proposal = install_Proposal;
    _bcHFCAPI.instantiate_Proposal = instantiate_Proposal;

        _bcHFCAPI.deployChaincode = deployChaincode;
        _bcHFCAPI.invokeContract = invokeContract;
        _bcHFCAPI.invokeSign = invokeSign;
        _bcHFCAPI.invokeCash = invokeCash;
    //2017/01/23 chaincode合并 start
    //     _bcHFCAPI.initCash = initCash;
    //     _bcHFCAPI.initContract = initContract;
    //     _bcHFCAPI.initSign = initSign;
        _bcHFCAPI.initBill = initBill;
    //2017/01/23 chaincode合并 end
        _bcHFCAPI.logonUser = logonUser;
        _bcHFCAPI.getChaincodeHandlers = function(){
             return chaincodeHandlers;
        };
    return _bcHFCAPI;
};


module.exports = bcHFCAPI;