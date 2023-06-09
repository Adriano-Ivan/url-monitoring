/*
* Request handlers
*
*/

const _data = require('./data');
const helpers = require('./helpers');

// Define the handlers
const handlers = {};

// Ping handler
handlers.ping = function(data,callback){
    callback(200);
}

// Not found handler
handlers.notFound = function(data,callback){
    callback(404);
};

// user submethods
handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function(data, callback){
    console.log(data.payload)
    // Check that all required fields are filled out
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ?
        data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ?
        data.payload.lastName.trim() : false;
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 11 ?
        data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ?
        data.payload.password.trim() : false;
    const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ?
        true : false;

    if(firstName && lastName && phone && password && tosAgreement){
        // Make sure that the user doesnt already exist
        _data.read('users',phone, function(err,data){
            if(err){
                // Hash the password
                const hashedPassword = helpers.hash(password);

                if(hashedPassword){
                    // Create hte user object
                    const userObject = {
                        'firstName': firstName,
                        'lastName':lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true
                    };

                    // Store the user
                    _data.create('users',phone,userObject, function(err){
                        if(!err){
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {'Error': 'Could not create the new user'})
                        }
                    });
                } else {
                    callback(500, {'Error': 'Could not hash the user\'s password'});
                }

            } else {
                // User already exists
                callback(400, {'Error': 'A user with that phone number already exists'})
            }
        })
    } else {
        callback(400, {'Error': 'Missing required fields'})
    }
}

// Users - get
// Required data: phone
// Optional data: none
// @TODO Only let an authenticated user access their object. Don't let htem access anyone's object
handlers._users.get = function(data, callback){
    // Check that the phone number is valid
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 11 ?
        data.queryStringObject.phone.trim() : false;
    if(phone){
        // Lookup the user
        _data.read('users', phone,function(err, data){
            if(!err && data){
                // Remove the hashed passwword from the user object before returning it to the request
                delete data.hashedPassword;
                callback(200, data);
            } else {
                callback(404);
            }
        })
    } else {
        callback(400, {'Error': 'Missing required field !'})
    }
}

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
// @TODO Only let an authenticated user update their own object. Don't let them update anyone's else
handlers._users.put = function(data, callback){
    // Check for the required field
    // Check that the phone number is valid
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 11 ?
    data.payload.phone.trim() : false;

    // Check for the optional data
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ?
    data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ?
        data.payload.lastName.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ?
        data.payload.password.trim() : false;

    // Error if the phone is invalid
    if(phone){
        // Error if nothing is sent to update
        if(firstName || lastName || password){
            // Lookup the user
            _data.read('users', phone, function(err, userData){
                if(!err && userData){
                    // Update the fields necessary
                    if(firstName){
                        userData.firstName = firstName;
                    }

                    if(lastName){
                        userData.lastName = lastName;
                    }

                    if(password){
                        userData.hashedPassword = helpers.hash(password);
                    }

                    // Store hte new updates
                    _data.update('users', phone, userData, function(err){
                        if(!err){
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {'Error': 'Could not update the user !'})
                        }
                    })
                } else {
                    callback(400, {'Error': 'The specified user does not exist'})
                }
            })
        } else {
            callback(400, {'Error': 'Missing fields to update'});
        }
    } else {
        callback(400, {'Error': 'Missing required field'})
    }
}

// Users - delete
// Required field: phone
// @TODO Only let an authenticated user delete their objects. Don't let them delete anyone's else
// @TODO Cleanup (delete) any other data files associated with this user
handlers._users.delete = function(data, callback){
    // Check if the phone number is valid 
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 11 ?
    data.queryStringObject.phone.trim() : false;

    if(phone){
        // Lookup the user
        _data.read('users', phone,function(err, data){
            console.log(data, phone)
            if(!err && data){
                // Delete file
                _data.delete('users', phone,function(err){
                    if(!err){
                        callback(200);
                    } else {
                        callback(500, {"Error":"Could not delete the user !"})
                    }
                })
               
            } else {
                callback(404,{"Error": "Could not find the specified user"});
            }
        })
    } else {
        callback(400, {'Error': 'Missing required field !'})
    }
}

handlers.users = function(data,callback){
    const acceptableMethods = ['post','get','put','delete'];

    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._users[data.method](data,callback);
    } else{
        callback(405);
    }
}


// Export the module
module.exports = handlers;