const mongoose = require('mongoose');
const Joi = require('joi');

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 512,
  },
  image: {
    type: String,
    trim: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Comment = mongoose.model('Comment', commentSchema);

function validateComment(comment) {
  const schema = Joi.object({
    text: Joi.string().min(2).max(512).required(),
    image: Joi.string(),
  });

  return schema.validate(comment, {
    abortEarly: false,
  });
}

exports.Comment = Comment;
exports.validateComment = validateComment;
