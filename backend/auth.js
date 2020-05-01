// Libraries and other modules
const express = require('express');
const authRoute = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const debugMsg = require('./utilities').debugMsg;
const MongoUsers = require('./models/user-models');

// Module globals
const KEY = 'zjuAa4ItuPrL|woJk^zXn#c2wwt6&,<KS3k!9"<CbiA?E}Ps&WmWy/+Xhu+zZ?y';

/**
 * middleware to confirm user has an acceptable token. returns userId in req if all is ok
 */
function verifyToken(req, res, next) {

  debugMsg('verifyToken');

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


authRoute.post('/update-user-data', verifyToken, (req, res) => {

  debugMsg('updateUserData');

  delete req.body._id;
  MongoUsers.Users
    .updateOne( {_id: req.userId}, {$set: req.body}, {upsert: false, writeConcern: {j: true}})
    .then( (doc) => {
      res.status(201).json( {success: 'success'} );
    })

})


authRoute.post('/register', (req, res) => {
// take incoming user data in the form {email, password}, hash password,
// save to db, get json token and return to front end

  debugMsg('register user');

  const saltRounds = 10;

  // confirm that email address does not exist in db
  MongoUsers.Users
    .findOne( {email: req.body.email}, {} )
    .then( (user) => {

      if ( user ) {
        throw 'This email address has already been registered';

      } else {
        // email is new
        bcrypt.hash(req.body.password, saltRounds).then( (hash) => {

          MongoUsers.Users.create({...req.body, hash}).then( (regUser) => {
            const token = jwt.sign( {subject: regUser._id}, KEY);
            res.status(200).send({token, user: regUser});
          }).catch( (err) => {
            throw err.toString();
          });

        }).catch( (err) => {
          throw err.toString();
        })
      }

    }).catch( (err) => {
      debugMsg('ERROR: ' + err);
      res.status(401).send(err);
    })


});

authRoute.post('/login', (req, res) => {

  debugMsg('login user');

  // check that user exists and return data in variable user
  MongoUsers.Users
    .findOne( {userName: req.body.userName}, {} )
    .then( (user) => {

    if (!user) {
      throw 'User name not found.'

    } else {
      // user exists
      bcrypt.compare(req.body.password, user.hash).then( (result) => {

        if (result) {
          const token = jwt.sign({ subject: user._id }, KEY);
          res.status(200).send({token, user});
        } else {
          throw 'Password did not match';
        }

      }).catch( (err) => {
        throw err.toString();
      })
    }

  }).catch( (err) => {
    debugMsg('ERROR: ' + err);
    res.status(401).send(err.toString());
  })

});


module.exports = { authRoute, verifyToken };
