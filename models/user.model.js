const mongoose = require('mongoose');
const Joi = require('joi');
const jwt = require('jsonwebtoken');

//getting environment variables (process.env) through dotenv config.env. remove in prod. configuration.
// require('dotenv').config({ path: '../config/config.env' });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true,
    minlength: 2,
    maxlength: 255,
  },
  email: {
    type: String,
    trim: true,
    required: true,
    minlength: 6,
    maxlength: 255,
    unique: true,
  },
  password: {
    type: String,
    trim: true,
    required: true,
    minlength: 6,
    maxlength: 1024,
  },
  birthdate: {
    type: Date,
    default: Date.now,
  },
  gender: {
    type: String,
    enum: ['Female', 'Male', 'Other'],
    default: 'Other',
  },
  role: {
    type: String,
    enum: ['Regular', 'Admin'],
    default: 'Regular',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
  ],
});

userSchema.methods.generateAuthToken = function () {
  const jwtKey = process.env.JWT_TOKEN_KEY || 'yourTokenKey';
  const token = jwt.sign(
    {
      _id: this._id,
      name: this.name,
      email: this.email,
      role: this.role,
    },
    jwtKey
  );
  return token;
};

const User = mongoose.model('User', userSchema);

//validateUser --> helper function to validate user required fields

function validateUser(user) {
  const schema = Joi.object({
    name: Joi.string().min(2).max(255).required(),
    email: Joi.string().min(6).max(255).email().required(),
    password: Joi.string().min(6).max(1024).required(),
    birthdate: Joi.date(),
    gender: Joi.string().valid('Female', 'Male', 'Other'),
    role: Joi.string().valid('Regular', 'Admin'),
  });

  return schema.validate(user, {
    abortEarly: false,
  });
}

exports.User = User;
exports.validateUser = validateUser;
