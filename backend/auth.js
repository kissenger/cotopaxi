// Libraries and stuff
const express = require('express');
const authRoute = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Mongoose setup ... mongo password: p6f8IS4aOGXQcKJN
const MongoUsers = require('./models/user-models');

function verifyToken(req, res, next) {

  if (!req.headers.authorization) {
    return res.status(401).send('Unauthorised request');
  }

  const token = req.headers.authorization;
  if ( token === 'null' ) {
    return res.status(401).send('Unauthorised request');
  }

  const payload = jwt.verify(token, 'AppleCrumbleAndCustard');
  if ( !payload ) {
    return res.status(401).send('Unauthorised request');
  }

  req.userId = payload.subject;
  next();

}


authRoute.post('/register', (req, res) => {
// take incoming user data in the form {email, password}, hash password,
// save to db, get json token and return to front end

  const jwtSecretKey = 'AppleCrumbleAndCustard';
  const saltRounds = 10;

  // confirm that email address does not exist in db
  MongoUsers.Users
    .findOne( {email: req.body.email}, {'_id': 1} )
    .then( (user) => {

      if ( user ) {
        // email already exists in db
        res.status(200).send('Email address is already registered');

      } else {
        // email is new
        bcrypt.hash(req.body.password, saltRounds).then( (hash) => {

          const userData = req.body;
          req.body['hash'] = hash;

          MongoUsers.Users.create(userData).then( (regUser) => {
            const token = jwt.sign( {subject: regUser._id}, jwtSecretKey);
            res.status(200).send({token});
          })
        })

      }

  })

});

authRoute.post('/login', (req, res) => {

  const jwtSecretKey = 'AppleCrumbleAndCustard';

  // check that email address exists and return data in variable user
  MongoUsers.Users.findOne( {email: req.body.email}, {'hash': 1} ).then( (user) => {

    if (!user) {
      // user does not exist
      res.status(401).send('Email address is not registered');

    } else {
      // user exists
      bcrypt.compare(req.body.password, user.hash).then( (result) => {

        if (result) {
          // password is ok
          const token = jwt.sign({ subject: user._id }, jwtSecretKey);
          res.status(200).send({token});
        } else {
          // incorrect password
          res.status(401).send('Password does not match registered email');
        }

      })
    }
  })
});


module.exports = { authRoute, verifyToken };
