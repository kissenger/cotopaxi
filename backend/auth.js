// Libraries and stuff
const express = require('express');
const authRoute = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const timeStamp = require('./utils.js').timeStamp;
// const KEY = 'AppleCrumbleAndCustard';
const KEY = 'ma8MKeK&&n1wlJNOm@ne08';
const DEBUG = true;

// Mongoose setup ... mongo password: p6f8IS4aOGXQcKJN
const MongoUsers = require('./models/user-models');

/**
 * middleware to confirm user has an acceptable token. returns userId in req if all is ok
 */
function verifyToken(req, res, next) {

  if (DEBUG) { console.log(timeStamp() + '>> verifyToken') };

  if (!req.headers.authorization) {
    return res.status(401).send('Unauthorised request');
  }

  const token = req.headers.authorization;
  if ( token === 'null' ) {
    return res.status(401).send('Unauthorised request');
  }

  const payload = jwt.verify(token, KEY);
  if ( !payload ) {
    return res.status(401).send('Unauthorised request');
  }

  req.userId = payload.subject;
  next();

}


authRoute.post('/register', (req, res) => {
// take incoming user data in the form {email, password}, hash password,
// save to db, get json token and return to front end

  if (DEBUG) { console.log(timeStamp() + '>> register') };
  const saltRounds = 10;

  // confirm that email address does not exist in db
  MongoUsers.Users
    .findOne( {email: req.body.email}, {'_id': 1} )
    .then( (user) => {

    if ( user ) {
      throw 'This email address has already been registered';

    } else {
      // email is new
      bcrypt.hash(req.body.password, saltRounds).then( (hash) => {

        MongoUsers.Users.create({...req.body, hash}).then( (regUser) => {
          const token = jwt.sign( {subject: regUser._id}, KEY);
          res.status(200).send({token});
        }).catch( (err) => {
          throw err.toString();
        });

      }).catch( (err) => {
        throw err.toString();
      })
    }
    
  }).catch( (err) => {
    if (DEBUG) { console.log(' >> ERROR: ' + err); }
    res.status(401).send(err);
  })
  

});

authRoute.post('/login', (req, res) => {

  if (DEBUG) { console.log(timeStamp() + '>> login') };

  // check that user exists and return data in variable user
  MongoUsers.Users
    .findOne( {userName: req.body.userName}, {'hash': 1} )
    .then( (user) => {
 
    if (!user) {
      throw 'User name not found.'

    } else {
      // user exists
      bcrypt.compare(req.body.password, user.hash).then( (result) => {

        if (result) {
          const token = jwt.sign({ subject: user._id }, KEY);
          res.status(200).send({token});
        } else {
          throw 'Password did not match';
        }

      }).catch( (err) => {
        throw err.toString();
      })
    }

  }).catch( (err) => {
    if (DEBUG) { console.log(' >> ERROR: ' + err); }
    res.status(401).send(err.toString());
  })

});


module.exports = { authRoute, verifyToken };
