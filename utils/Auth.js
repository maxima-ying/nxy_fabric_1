var jwt = require('jsonwebtoken');
var logger = require('../log').Logger;

function validateUser(user) {
    var localStore = require('./LocalStore');
    var users = localStore.loadUsers();
    var validUser = null;
    users.forEach(function(usr) {
        if (usr.username == user.username && usr.passwd == user.passwd) {
            validUser = usr;
        }
    });
    return validUser;
}

function validateToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch(err) {
        //logger.info(err);
        return null;
    }
}
//
// function updateToken(user) {
//     console.log(JSON.stringify(global['JWT_TOKENS']));
//     try {
//         var token = jwt.sign({username: user.username, passwd: user.passwd}, process.env.JWT_SECRET);
//         console.log(token);
//         global['JWT_TOKENS'][user.username] = token;
//         console.log(JSON.stringify(global['JWT_TOKENS'][user.username]));
//         return token;
//     } catch(err) {
//         return null;
//     }
// }

exports.validateUser = validateUser;
exports.validateToken = validateToken;
//exports.updateToken = updateToken;