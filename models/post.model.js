const mongoose = require('mongoose');
const Joi = require('joi');
const _ = require('lodash');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 255,
  },
  text: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 1024,
  }, 
  image: {
    type: String,
    trim: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
  },  
  tags: [String],
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Post = mongoose.model('Post', postSchema);

function validatePost(post) {
  const schema = Joi.object({
    title: Joi.string().min(2).max(255).required(),
    text: Joi.string().min(2).max(1024).required(),
    image: Joi.string(),
    tags: Joi.array().items(Joi.string()),
  });

  return schema.validate(post, {
    abortEarly: false,
  });
}

exports.Post = Post;
exports.validatePost = validatePost;
