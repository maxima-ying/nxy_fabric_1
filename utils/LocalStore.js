var fs = require('fs');
var path = require('path');

var LocalStore = function() {
  var _LocalStore = {};

  var loadLanguage = function(){
    var JsonObj = JSON.parse(fs.readFileSync('./data/lang_jp.json'));
    return JsonObj;
  }

  var loadUsers = function() {
    var JsonObj = JSON.parse(fs.readFileSync('./data/users.json'));
    return JsonObj['users'];
  };

  var loadTasks = function () {
    var JsonObj = JSON.parse(fs.readFileSync('./data/tasks.json'));
    return JsonObj['tasks'];
  };

  var loadTask = function (id) {
    var tasks = loadTasks();
    var selectd = null;
    tasks.forEach(function (task) {
      if (task.bill_no == id) {
        selectd = task;
      }
    });
    return selectd;
  };

  var loadBills = function (step) {
    var JsonObj = JSON.parse(fs.readFileSync('./data/bills.json'));
    var bills = JsonObj['bills'];
    var result = [];
    if (step && step != 'ALL') {
      console.log('filter[step=' + step + ']');
      for (var i = 0; i < bills.length; i++) {
        if (bills[i].current_step.id == step) {
          result.push(bills[i]);
        }
      }
      return result;
    } else {
      return bills;
    }
  };

  var loadBill = function (bill_no) {
    var bills = loadBills();
    var selected = null;
    bills.forEach(function (bill) {
      if (bill.bill_no == bill_no) {
        selected = bill;
      }
    });
    return selected;
  };

  var addBill = function (id) {
    var bills = loadBills();
    bills.push(id);
    fs.writeFileSync('./data/bills.json', JSON.stringify({bills: bills}));
  };

  var saveBill = function (data) {
    var bills = loadBills();
    bills.forEach(function (bill, i) {
      if (bill.bill_no == data.bill_no) {
        bills[i] = data;
        var fs = require('fs');
        fs.writeFileSync('./data/bills.json', JSON.stringify({bills: bills}));
      }
    });
  };

  var clearBill = function () {
    fs.writeFileSync('./data/bills.json', JSON.stringify({bills: []}));
  };

  var loadWorkflow = function () {
    var JsonObj = JSON.parse(fs.readFileSync('./data/workflow.json'));
    return JsonObj['steps'];
  };

  var loadAccounts = function () {
    var JsonObj = JSON.parse(fs.readFileSync('./data/accounts.json'));
    return JsonObj['accounts'];
  };

  var loadAccount = function (party) {
    var accounts = loadAccounts();
    var selected = null;
    accounts.forEach(function (account) {
      if (account.party == party) {
        selected = account;
      }
    });
    return selected;
  };

  var saveAccount = function (data) {
    var accounts = loadAccounts();
    accounts.forEach(function (account, i) {
      if (account.party == data.party) {
        accounts[i] = data;
        fs.writeFileSync('./data/accounts.json', JSON.stringify({accounts: accounts}));
      }
    });
  };

  var saveChaincode = function (data) {
    fs.writeFileSync('./data/chaincode.json', JSON.stringify(data));
  }

  var loadChaincode = function (){
    var JsonObj = JSON.parse(fs.readFileSync('./data/chaincode.json'));
    return JsonObj;
  }

  _LocalStore.loadLanguage = loadLanguage;
  _LocalStore.loadUsers = loadUsers;
  _LocalStore.loadBills = loadBills;
  _LocalStore.clearBill = clearBill;
  _LocalStore.loadBill = loadBill;
  _LocalStore.saveBill = saveBill;
  _LocalStore.addBill = addBill;
  _LocalStore.loadTask = loadTask;
  _LocalStore.loadTasks = loadTasks;
  _LocalStore.loadWorkflow = loadWorkflow;
  _LocalStore.loadAccount = loadAccount;
  _LocalStore.saveAccount = saveAccount;
  _LocalStore.saveCash = saveChaincode;
  _LocalStore.loadChaincode = loadChaincode;
  _LocalStore.saveChaincode = saveChaincode;
  return _LocalStore;
}();

module.exports = LocalStore;