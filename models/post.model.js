const mongoose = require('mongoose');
const Joi = require('joi');

const postSchema = new mongoose.Schema({
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
  imageKey: {
    type: String,
    trim: true,
  },
  imageLocation: {
    type: String,
    trim: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  tags: [String],
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  comments: [
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
