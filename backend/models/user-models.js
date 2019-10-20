const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  email: {type: String, required: true},
  hash: {type: String, required: true},
  firstName: {type: String},
  lastName: {type: String},
  homeLngLat: {type: [Number]}
})

const Users = mongoose.model('user', userSchema);

module.exports = {
  Users: Users
};
