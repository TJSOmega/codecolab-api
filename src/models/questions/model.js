'use strict';

const mongoose = require('mongoose');

const questionSchema = mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  resources: { type: Array },
  type: {type: String},
  difficulty: {type: String}
});

const QuestionModel = mongoose.model('question', questionSchema);

module.exports = QuestionModel;
