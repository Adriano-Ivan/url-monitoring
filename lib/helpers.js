/*
* Helpers for various tasks
*
*/

// Dependencies
const crypto = require('crypto');
const config = require('./config');

// Container for all the helpers
const helpers = {};

// SHA256 hash
helpers.hash = function(str){
    if(typeof(str) == 'string' && str.length > 0){
        const hash = crypto.createHmac('sha256',config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
}


// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str){
    try {
        const obj = JSON.parse(str);
        return obj;
    } catch(e){
        return {};
    }
}

module.exports = helpers;