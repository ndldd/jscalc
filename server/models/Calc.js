var mongoose = require('mongoose');

var calcSchema = new mongoose.Schema({
  _id: String,
  doc: {},
  published: {type: Boolean, default: false},
  permissions: [{
    level: {type: String, enum: ['owner']},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
  }]
});

module.exports = mongoose.model('Calc', calcSchema);
