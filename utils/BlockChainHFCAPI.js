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
var path = require('path');
var grpc = require('grpc');

var testUtil = require('./util.js');

var tx_id = null;
var nonce = null;
var the_user = null;

var allEventhubs = [];

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

    var chaincodeHandlers = new Object();

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

    var _commonProto = grpc.load('./fabric-client/lib/protos/common/common.proto').common;





    //var chaincodeHandlers = new Object();

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

/*
    var logonUser = function(user, callback) {

        logger.info('path:'+ '/tmp/hfc-test-kvs_'+ org);

        //var getuser = hfc.getUserContext('admin');

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
                        //remember user in variable the_user
                        the_user = user;
                        // return user;
                        callback(null, user);
                    }
                    else{
                        //用户不存在的情况下，
                        logger.info('user.isEnrolled() == false');

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
                    }
                });

        });
    };
*/
    var create_Channel = function(callback) {
        logger.info('createChannel-------start---------');

        var client = new hfc();
        var chain = client.newChain(testUtil.END2END.channel);

        var caRootsPath = ORGS.orderer.tls_cacerts;
        let data = fs.readFileSync(path.join(__dirname,caRootsPath));
        let caroots = Buffer.from(data).toString();

        chain.addOrderer(
            new Orderer(
                ORGS.orderer.url,
                {
                    'pem': caroots,
                    'ssl-target-name-override': ORGS.orderer['server-hostname']
                }
            ));

        // Acting as a client in org1 when creating the channel
        var org = ORGS.org1.name;

        // utils.setConfigSetting('key-value-store', path.join(__dirname,'../fabric-client/lib/impl/FileKeyValueStore.js'));
        return hfc.newDefaultKeyValueStore({
            path: testUtil.storePathForOrg(org)
        }).then(function(store){
            client.setStateStore(store);
            // return testUtil.getSubmitter(client, true, 'org1');
            return testUtil.getSubmitter(client, 'org1');
        })
            .then(function(admin){
                logger.info('Successfully enrolled user \'admin\'');
                the_user = admin;

                // readin the envelope to send to the orderer
                data = fs.readFileSync(path.join(__dirname,'../fixtures/channel/mychannel.tx'));
                var request = {
                    envelope : data
                };
                // send to orderer
                return chain.createChannel(request);
            }, function(err){
                logger.error('Failed to enroll user \'admin\'. ' + err);
                callback('Failed to enroll user \'admin\'. ' + err);
            })
            .then(function(response){
                logger.info(' response ::%j',response);

                if (response && response.status === 'SUCCESS') {
                    logger.info('Successfully created the channel.');
                    return sleep(5000);
                } else {
                    logger.error('Failed to create the channel. ');
                    callback('Failed to create the channel. ');
                }
            }, function(err){
                logger.error('Failed to initialize the channel: ' + err.stack ? err.stack : err);
                callback('Failed to create the channel. ');
            })
            .then(function(nothing){
                logger.info('Successfully waited to make sure new channel was created.');
                callback(null, the_user);
            }, function(err){
                logger.error('Failed to sleep due to error: ' + err.stack ? err.stack : err);
                callback('Failed to sleep due to error: ' + err.stack ? err.stack : err);
            });
    };

    var join_Channel = function(org, callback) {
        logger.info('join_Channel-------start---------');

        var client = new hfc();
        var chain = client.newChain(testUtil.END2END.channel);
        var caRootsPath = ORGS.orderer.tls_cacerts;
        let data = fs.readFileSync(path.join(__dirname, caRootsPath));
        let caroots = Buffer.from(data).toString();

        chain.addOrderer(
            new Orderer(
                ORGS.orderer.url,
                {
                    'pem': caroots,
                    'ssl-target-name-override': ORGS.orderer['server-hostname']
                }
            )
        );

        var orgName = ORGS[org].name;

        var targets = [];
        var eventhubs = [];

        //new peer
        for (let key in ORGS[org]) {
            if (ORGS[org].hasOwnProperty(key)) {
                if (key.indexOf('peer') === 0) {
                    data = fs.readFileSync(path.join(__dirname,ORGS[org][key]['tls_cacerts']));
                    targets.push(
                        new Peer(
                            ORGS[org][key].requests,
                            {
                                pem: Buffer.from(data).toString(),
                                'ssl-target-name-override': ORGS[org][key]['server-hostname']
                            }
                        )
                    );

                    let eh = new EventHub();
                    eh.setPeerAddr(
                        ORGS[org][key].events,
                        {
                            pem: Buffer.from(data).toString(),
                            'ssl-target-name-override': ORGS[org][key]['server-hostname']
                        }
                    );
                    eh.connect();
                    eventhubs.push(eh);
                    allEventhubs.push(eh);
                }
            }
        }

        return hfc.newDefaultKeyValueStore({
            path: testUtil.storePathForOrg(orgName)
        }).then(function(store){
            client.setStateStore(store);
            // return testUtil.getSubmitter(client, true, org);
            return testUtil.getSubmitter(client, org);
        })
            .then(function(admin){
                logger.info('Successfully enrolled user \'admin\'');
                the_user = admin;

                nonce = utils.getNonce();
                tx_id = chain.buildTransactionID(nonce, the_user);

                var request = {
                    targets : targets,
                    txId : 	tx_id,
                    nonce : nonce
                };

                var eventPromises = [];
                eventhubs.forEach(function(eh){
                    let txPromise = new Promise(function(resolve, reject){
                        let handle = setTimeout(reject, 30000);

                        eh.registerBlockEvent(function(block){
                            clearTimeout(handle);

                            // in real-world situations, a peer may have more than one channels so
                            // we must check that this block came from the channel we asked the peer to join
                            if(block.data.data.length === 1) {
                                // Config block must only contain one transaction
                                var envelope = _commonProto.Envelope.decode(block.data.data[0]);
                                var payload = _commonProto.Payload.decode(envelope.payload);
                                var channel_header = _commonProto.ChannelHeader.decode(payload.header.channel_header);

                                if (channel_header.channel_id === testUtil.END2END.channel) {
                                    logger.info('The new channel has been successfully joined on peer '+ eh.ep._endpoint.addr);
                                    resolve();
                                }
                            }
                        });
                    });

                    eventPromises.push(txPromise);
                });
                let sendPromise = chain.joinChannel(request);
                return Promise.all([sendPromise].concat(eventPromises));
                // return Promise.all([sendPromise]);
            }, function(err){
                logger.error('Failed to enroll user \'admin\' due to error: ' + err.stack ? err.stack : err);
                callback('Failed to enroll user \'admin\' due to error: ' + err.stack ? err.stack : err);
            })
            .then(function(results){
                logger.info('Join Channel R E S P O N S E : ', results);

                for(var key in eventhubs) {
                    var eventhub = eventhubs[key];
                    if (eventhub && eventhub.isconnected()) {
                        logger.info('Disconnecting the event hub');
                        eventhub.disconnect();
                    }
                }

                if(results[0] && results[0][0] && results[0][0].response && results[0][0].response.status == 200) {
                    logger.info('Successfully joined peers in organization '+ orgName +' to join the channel');
                    callback(null,null);
                } else {
                    logger.error('Failed to join channel');
                    callback('Failed to join channel');
                }
            }, function(err){

                for(var key in eventhubs) {
                    var eventhub = eventhubs[key];
                    if (eventhub && eventhub.isconnected()) {
                        logger.info('Disconnecting the event hub');
                        eventhub.disconnect();
                    }
                }

                logger.error('Failed to join channel due to error: ' + err.stack ? err.stack : err);
                callback('Failed to join channel due to error: ' + err.stack ? err.stack : err);
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
    var deployChaincode = function(org, chaincode, functionName, args, callback) {
        logger.info("deployChaincode ---- start ------")

        instantiate_Proposal( org, functionName, args ,function(err,result) {
            //member, chaincode, functionName, args ,callback) {
            if (err) {
                callback(err);
            }
            else {

                //TODO: add saveChaincode
                // Deploy request completed successfully
                //var chaincodeID = response2.chaincodeID;
                var chaincodeID = chaincode_id;
                var chaincodeData = LocalStore.loadChaincode();
                chaincodeData[chaincode] = chaincodeID;
                LocalStore.saveChaincode(chaincodeData);

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

    var install_Proposal = function(org, callback) {

        logger.info('installProposal-------start---------');

        var client = new hfc();
        var chain = client.newChain(testUtil.END2END.channel);

        var caRootsPath = ORGS.orderer.tls_cacerts;
        let data = fs.readFileSync(path.join(__dirname, caRootsPath));
        let caroots = Buffer.from(data).toString();

        chain.addOrderer(
            new Orderer(
                ORGS.orderer.url,
                {
                    'pem': caroots,
                    'ssl-target-name-override': ORGS.orderer['server-hostname']
                }
            )
        );

        var orgName = ORGS[org].name;

        var targets = [];
        for (let key in ORGS[org]) {
            if (ORGS[org].hasOwnProperty(key)) {
                if (key.indexOf('peer') === 0) {
                    let data = fs.readFileSync(path.join(__dirname,ORGS[org][key]['tls_cacerts']));
                    let peer = new Peer(
                        ORGS[org][key].requests,
                        {
                            pem: Buffer.from(data).toString(),
                            'ssl-target-name-override': ORGS[org][key]['server-hostname']
                        }
                    );

                    targets.push(peer);
                    chain.addPeer(peer);
                }
            }
        }

        return hfc.newDefaultKeyValueStore({
            path: testUtil.storePathForOrg(orgName)
        }).then(function(store){
            client.setStateStore(store);
            // return testUtil.getSubmitter(client, true, org);
            return testUtil.getSubmitter(client, org);
        }).then(function(admin){
            logger.info('Successfully enrolled user \'admin\'');
            the_user = admin;

            nonce = utils.getNonce();
            tx_id = chain.buildTransactionID(nonce, the_user);

            // send proposal to endorser
            var request = {
                targets: targets,
                chaincodePath: testUtil.CHAINCODE_PATH,
                chaincodeId: testUtil.END2END.chaincodeId,
                chaincodeVersion: testUtil.END2END.chaincodeVersion,
                txId: tx_id,
                nonce: nonce
            };

            return chain.sendInstallProposal(request);
        },function(err){
            logger.error('Failed to enroll user \'admin\'. ' + err);
            callback('Failed to enroll user \'admin\'. ' + err);
        }).then(function(results){
            var proposalResponses = results[0];

            var proposal = results[1];
            var header   = results[2];
            var all_good = true;
            for(var i in proposalResponses) {
                let one_good = false;
                if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
                    one_good = true;
                    logger.info('install proposal was good');
                } else {
                    logger.error('install proposal was bad');
                }
                all_good = all_good & one_good;
            }
            if (all_good) {
                logger.info('Successfully sent install Proposal and received ProposalResponse: Status - '+ proposalResponses[0].response.status);
                callback(null);
            } else {
                logger.error('Failed to send install Proposal or receive valid response. Response null or status is not 200. exiting...');
                callback('Failed to send install Proposal or receive valid response. Response null or status is not 200. exiting...');
            }
        },function(err){
            logger.info('Failed to send install proposal due to error: ' + err.stack ? err.stack : err);
            callback('Failed to send install proposal due to error: ' + err.stack ? err.stack : err);
        });

        logger.info('installProposal-------end---------');
    };

    // when chain is deployed ,before invoke, the chain need to be initialize  (MAYBE)
    var initialize_chain= function(callback) {
        logger.info('initialize_Chain-------start---------');

        //the_user = member;
        the_user.mspImpl._id = 'Org1MSP'; //see config.json

        // read the config block from the orderer for the chain
        // and initialize the verify MSPs based on the participating
        // organizations
        chain.initialize()
            .then(function(success){
                logger.info('initialize_Chain OK')
                sleep(30000);
            },function(err){
                logger.error('chain initialize() error');
                callback('chain initialize() error');
            });
    };

    // TODO:这里传参 chaincode 和 全局变量 chaincode_path 重复,暂时没用上
    var instantiate_Proposal = function(org, functionName, args ,callback) {
        logger.info('instantiate_Chaincode-------start---------');

        var client = new hfc();
        var chain = client.newChain(testUtil.END2END.channel);

        var caRootsPath = ORGS.orderer.tls_cacerts;
        let data = fs.readFileSync(path.join(__dirname,caRootsPath));
        let caroots = Buffer.from(data).toString();

        chain.addOrderer(
            new Orderer(
                ORGS.orderer.url,
                {
                    'pem': caroots,
                    'ssl-target-name-override': ORGS.orderer['server-hostname']
                }
            )
        );

        var orgName = ORGS[org].name;

        var targets = [];
        var eventhubs = [];

        // set up the chain to use each org's 'peer1' for
        // both requests and events
        let key = org;
        if (key) {
            // for (let key in ORGS) {
            if (ORGS.hasOwnProperty(key) && typeof ORGS[key].peer1 !== 'undefined') {
                let data = fs.readFileSync(path.join(__dirname,ORGS[key].peer1['tls_cacerts']));
                let peer = new Peer(
                    ORGS[key].peer1.requests,
                    {
                        pem: Buffer.from(data).toString(),
                        'ssl-target-name-override': ORGS[key].peer1['server-hostname']
                    }
                );
                chain.addPeer(peer);

                let eh = new EventHub();
                eh.setPeerAddr(
                    ORGS[key].peer1.events,
                    {
                        pem: Buffer.from(data).toString(),
                        'ssl-target-name-override': ORGS[key].peer1['server-hostname']
                    }
                );
                eh.connect();
                eventhubs.push(eh);
                allEventhubs.push(eh);
            }
        }

        return hfc.newDefaultKeyValueStore({
            path: testUtil.storePathForOrg(orgName)
        }).then(function(store){
            client.setStateStore(store);
            // return testUtil.getSubmitter(client, true, org);
            return testUtil.getSubmitter(client, org);
        }).then(function(admin){
            logger.info('Successfully enrolled user \'admin\'');
            the_user = admin;

            // read the config block from the orderer for the chain
            // and initialize the verify MSPs based on the participating
            // organizations
            return chain.initialize();
        }, function(err){
            logger.error('Failed to enroll user \'admin\'. ' + err);
            callback('Failed to enroll user \'admin\'. ' + err);
        }).then(function(success){
            nonce = utils.getNonce();
            tx_id = chain.buildTransactionID(nonce, the_user);
            // send proposal to endorser
            var request = {
                chaincodePath: testUtil.CHAINCODE_PATH,
                chaincodeId: testUtil.END2END.chaincodeId,
                chaincodeVersion: testUtil.END2END.chaincodeVersion,
                //fcn: 'init',
                fcn: functionName,
                //args: ['a', '100', 'b', '200'],
                args: args,
                chainId: testUtil.END2END.channel,
                txId: tx_id,
                nonce: nonce
            };
            return chain.sendInstantiateProposal(request);
        }, function(err){
            logger.error('Failed to initialize the chain');
            throw new Error('Failed to initialize the chain');
        }).then(function(results){
            var proposalResponses = results[0];
            var proposal = results[1];
            var header   = results[2];
            var all_good = true;
            for(var i in proposalResponses) {
                let one_good = false;
                if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
                    one_good = true;
                    logger.info('instantiate proposal was good');
                } else {
                    logger.error('instantiate proposal was bad');
                }
                all_good = all_good & one_good;
            }
            if (all_good) {
                logger.info('Successfully sent Proposal and received ProposalResponse: Status - '+proposalResponses[0].response.status+'' +
                    ', message - "'+proposalResponses[0].response.message+'"' +
                    ', metadata - "'+proposalResponses[0].response.payload+'"' +
                    ', endorsement signature: '+proposalResponses[0].endorsement.signature);

                var request = {
                    proposalResponses: proposalResponses,
                    proposal: proposal,
                    header: header
                };

                // set the transaction listener and set a timeout of 30sec
                // if the transaction did not get committed within the timeout period,
                // fail the test
                // var deployId = tx_id.toString();
                //
                // var eventPromises = [];
                // eventhubs.forEach(function(eh){
                //     let txPromise = new Promise(function(resolve, reject){
                //         let handle = setTimeout(reject, 30000);
                //
                //         eh.registerTxEvent(deployId.toString(), function(tx, code){
                //             logger.info('The chaincode instantiate transaction has been committed on peer '+ eh.ep._endpoint.addr);
                //             clearTimeout(handle);
                //             eh.unregisterTxEvent(deployId);
                //             if (code !== 'VALID') {
                //                 logger.error('The chaincode instantiate transaction was invalid, code = ' + code);
                //                 reject();
                //             } else {
                //                 logger.info('The chaincode instantiate transaction was valid.');
                //                 resolve();
                //             }
                //         });
                //     });
                //     eventPromises.push(txPromise);
                // });

                var sendPromise = chain.sendTransaction(request);
                // return Promise.all([sendPromise].concat(eventPromises))
                return Promise.all([sendPromise])
                    .then(function(results){
                        logger.info('Event promise all complete and testing complete');
                        return results[0]; // the first returned value is from the 'sendPromise' which is from the 'sendTransaction()' call
                    }).catch(function(err){
                        logger.error('Failed to send instantiate transaction and get notifications within the timeout period.');
                        callback('Failed to send instantiate transaction and get notifications within the timeout period.');
                    });
            } else {
                logger.error('Failed to send instantiate Proposal or receive valid response. Response null or status is not 200. exiting...');
                callback('Failed to send instantiate Proposal or receive valid response. Response null or status is not 200. exiting...');
            }
        }, function(err){
            logger.error('Failed to send instantiate proposal due to error: ' + err.stack ? err.stack : err);
            callback('Failed to send instantiate proposal due to error: ' + err.stack ? err.stack : err);
        }).then(function(response){

            for(var key in eventhubs) {
                var eventhub = eventhubs[key];
                if (eventhub && eventhub.isconnected()) {
                    logger.info('Disconnecting the event hub');
                    eventhub.disconnect();
                }
            }

            if (response.status === 'SUCCESS') {
                logger.info('Successfully sent transaction to the orderer.');
                sleep(10000).then(function(nothing) {
                    logger.info('wait 10 s before callback.');
                    callback(null,null);
                });
            } else {
                logger.error('Failed to order the transaction. Error code: ' + response.status);
                callback('Failed to order the transaction. Error code: ' + response.status);
            }
        }, function(err){

            for(var key in eventhubs) {
                var eventhub = eventhubs[key];
                if (eventhub && eventhub.isconnected()) {
                    logger.info('Disconnecting the event hub');
                    eventhub.disconnect();
                }
            }

            logger.error('Failed to send instantiate due to error: ' + err.stack ? err.stack : err);
            callback('Failed to send instantiate due to error: ' + err.stack ? err.stack : err);
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
    var invokeChaincode = function(org, chaincode, functionName, args, callback) {
        logger.info('invoke_by_chaincode-------start---------');

        if (!org) {
            org = 'org1';
        }

        var client = new hfc();
        var chain = client.newChain(testUtil.END2END.channel);

        var orgName = ORGS[org].name;

        var targets = [];
        // set up the chain to use each org's 'peer1' for
        // both requests and events
        let key = org;
        if (key) {
            // for (let key in ORGS) {
            if (ORGS.hasOwnProperty(key) && typeof ORGS[key].peer1 !== 'undefined') {
                let data = fs.readFileSync(path.join(__dirname,ORGS[key].peer1['tls_cacerts']));
                let peer = new Peer(
                    ORGS[key].peer1.requests,
                    {
                        pem: Buffer.from(data).toString(),
                        'ssl-target-name-override': ORGS[key].peer1['server-hostname']
                    });
                chain.addPeer(peer);
            }
        }

        return hfc.newDefaultKeyValueStore({
            path: testUtil.storePathForOrg(orgName)
        }).then(function(store){
            client.setStateStore(store);
            // return testUtil.getSubmitter(client, true, org);
            return testUtil.getSubmitter(client, org);
        }).then(function(admin){
            the_user = admin;
            nonce = utils.getNonce();
            tx_id = chain.buildTransactionID(nonce, the_user);

            // send query
            var request = {
                chaincodeId : testUtil.END2END.chaincodeId,
                chaincodeVersion : testUtil.END2END.chaincodeVersion,
                chainId: testUtil.END2END.channel,
                txId: tx_id,
                nonce: nonce,
                fcn: functionName,
                args: args
            };

            return chain.queryByChaincode(request);
        },function(err){
            logger.info('Failed to get submitter \'admin\'. Error: ' + err.stack ? err.stack : err );
            callback('Failed to get submitter \'admin\'. Error: ' + err.stack ? err.stack : err );
        }).then(function(response_payloads){
            if (response_payloads) {
                for(let i = 0; i < response_payloads.length; i++) {
                    logger.info("query result:" + response_payloads[i].toString('utf8'));
                }
                callback(null,response_payloads[0].toString('utf8'));
            } else {
                logger.error('response_payloads is null');
                callback('response_payloads is null');
            }
        },function(err){
            logger.error('Failed to send query due to error: ' + err.stack ? err.stack : err);
            callback('Failed to send query due to error: ' + err.stack ? err.stack : err);
        }).catch(function(err){
            logger.error('Failed to end to end test with error:' + err.stack ? err.stack : err);
            callback('Failed to end to end test with error:' + err.stack ? err.stack : err);
        });

    };

    // 验证用的方法，来自test_hfc
    var invoke_by_chaincode = function(member, callback) {
        logger.info('query_by_chaincode-------start---------');

        var client = new hfc();
        var chain = client.newChain(testUtil.END2END.channel);

        var orgName = ORGS[org].name;

        var targets = [];
        // set up the chain to use each org's 'peer1' for
        // both requests and events
        let key = org;
        if (key) {
            // for (let key in ORGS) {
            if (ORGS.hasOwnProperty(key) && typeof ORGS[key].peer1 !== 'undefined') {
                let data = fs.readFileSync(path.join(__dirname,ORGS[key].peer1['tls_cacerts']));
                let peer = new Peer(
                    ORGS[key].peer1.requests,
                    {
                        pem: Buffer.from(data).toString(),
                        'ssl-target-name-override': ORGS[key].peer1['server-hostname']
                    });
                chain.addPeer(peer);
            }
        }

        return hfc.newDefaultKeyValueStore({
            path: testUtil.storePathForOrg(orgName)
        }).then(function(store){
            client.setStateStore(store);
            // return testUtil.getSubmitter(client, true, org);
            return testUtil.getSubmitter(client, org);
        }).then(function(admin){
            the_user = admin;
            nonce = utils.getNonce();
            tx_id = chain.buildTransactionID(nonce, the_user);

            // send query
            var request = {
                chaincodeId : testUtil.END2END.chaincodeId,
                chaincodeVersion : testUtil.END2END.chaincodeVersion,
                chainId: testUtil.END2END.channel,
                txId: tx_id,
                nonce: nonce,
                fcn: 'transfer',
                //args: ['move','a','b',"5"]
                args: ['P1','P2','5']
            };
            return chain.queryByChaincode(request);
        },function(err){
            logger.info('Failed to get submitter \'admin\'. Error: ' + err.stack ? err.stack : err );
            callback('Failed to get submitter \'admin\'. Error: ' + err.stack ? err.stack : err );
        }).then(function(response_payloads){
            if (response_payloads) {
                for(let i = 0; i < response_payloads.length; i++) {
                    logger.info("query result:" + response_payloads[i].toString('utf8'));
                }
                callback(null,response_payloads[0].toString('utf8'));
            } else {
                logger.error('response_payloads is null');
                callback('response_payloads is null');
            }
        },function(err){
            logger.error('Failed to send query due to error: ' + err.stack ? err.stack : err);
            callback('Failed to send query due to error: ' + err.stack ? err.stack : err);
        }).catch(function(err){
            logger.error('Failed to end to end test with error:' + err.stack ? err.stack : err);
            callback('Failed to end to end test with error:' + err.stack ? err.stack : err);
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

    var initBill = function(org, args, callback){
        //member = getMember(null);
        logger.info('正在部署bill');
        return deployChaincode(org, 'bill', 'initBill', args, callback);
    };
    //2017/01/23 chaincode合并 end

    var invokeSign = function(org, functionName, args, callback) {
        //member = getMember(member);

        //2017/01/23 chaincode合并 start
        // return invokeChaincode(member,'sign', functionName, args, callback);
        return invokeChaincode(org,'bill', functionName, args, callback);
        //2017/01/23 chaincode合并 end
    };

    var invokeContract = function(org, functionName, args, callback){
        //member = getMember(member);

        //2017/01/23 chaincode合并 start
        // return invokeChaincode(member,'contract', functionName, args, callback);
        return invokeChaincode(org,'bill', functionName, args, callback);
        //2017/01/23 chaincode合并 end
    };

    var invokeCash = function(org, functionName, args, callback){
        //member = getMember(member);

        //2017/01/23 chaincode合并 start
        // return invokeChaincode(member,'cash', functionName, args, callback);
        return invokeChaincode(org,'bill', functionName, args, callback);
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



    var query_by_chaincode = function(member, callback) {
         logger.info('query_by_chaincode-------start---------');

        var client = new hfc();
        var chain = client.newChain(testUtil.END2END.channel);

        var orgName = ORGS[org].name;

        var targets = [];
        // set up the chain to use each org's 'peer1' for
        // both requests and events
        let key = org;
        if (key) {
            // for (let key in ORGS) {
            if (ORGS.hasOwnProperty(key) && typeof ORGS[key].peer1 !== 'undefined') {
                let data = fs.readFileSync(path.join(__dirname,ORGS[key].peer1['tls_cacerts']));
                let peer = new Peer(
                    ORGS[key].peer1.requests,
                    {
                        pem: Buffer.from(data).toString(),
                        'ssl-target-name-override': ORGS[key].peer1['server-hostname']
                    });
                chain.addPeer(peer);
            }
        }

        return hfc.newDefaultKeyValueStore({
            path: testUtil.storePathForOrg(orgName)
        }).then(function(store){
            client.setStateStore(store);
            // return testUtil.getSubmitter(client, true, org);
            return testUtil.getSubmitter(client, org);
        }).then(function(admin){
            the_user = admin;
            nonce = utils.getNonce();
            tx_id = chain.buildTransactionID(nonce, the_user);

            // send query
            var request = {
                chaincodeId : testUtil.END2END.chaincodeId,
                chaincodeVersion : testUtil.END2END.chaincodeVersion,
                chainId: testUtil.END2END.channel,
                txId: tx_id,
                nonce: nonce,
                fcn: 'queryAccount',
                //args: ['query','b']
                args: [ 'P1']
            };
            return chain.queryByChaincode(request);
        },function(err){
            logger.info('Failed to get submitter \'admin\'. Error: ' + err.stack ? err.stack : err );
            callback('Failed to get submitter \'admin\'. Error: ' + err.stack ? err.stack : err );
        }).then(function(response_payloads){
            if (response_payloads) {
                for(let i = 0; i < response_payloads.length; i++) {
                    logger.info("query result:" + response_payloads[i].toString('utf8'));
                }
                callback(null,response_payloads[0].toString('utf8'));
            } else {
                logger.error('response_payloads is null');
                callback('response_payloads is null');
            }
        },function(err){
            logger.error('Failed to send query due to error: ' + err.stack ? err.stack : err);
            callback('Failed to send query due to error: ' + err.stack ? err.stack : err);
        }).catch(function(err){
            logger.error('Failed to end to end test with error:' + err.stack ? err.stack : err);
            callback('Failed to end to end test with error:' + err.stack ? err.stack : err);
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
    _bcHFCAPI.initialize_chain = initialize_chain;
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
    //    _bcHFCAPI.logonUser = logonUser;
        _bcHFCAPI.getChaincodeHandlers = function(){
             return chaincodeHandlers;
        };
    return _bcHFCAPI;
};


module.exports = bcHFCAPI;