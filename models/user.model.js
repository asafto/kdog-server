const mongoose = require("mongoose");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//getting environment variables (process.env) through dotenv config.env. remove in prod. configuration.
require("dotenv").config({ path: "../config/config.env" });

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
  role: {
    type: String,
    default: "regular",
  },
  resetPasswordLink: {
    type: String,
    default: "",
  },
  createdAt: { type: Date, default: Date.now },
  posts: Array,
});

userSchema.methods.generateAuthToken = function () {
  const jwtKey = process.env.JWT_TOKEN_KEY || "yourTokenKey";
  const token = jwt.sign(
    {
      _id: this._id,
      name: this.name,
      email: this.email,
    },
    jwtKey
  );
  return token;
};

const User = mongoose.model("User", userSchema);

//validateUser --> helper function to validate user required fields

function validateUser(user) {
  const schema = Joi.object({
    name: Joi.string().min(2).max(255).required(),
    email: Joi.string().min(6).max(255).required().email(),
    password: Joi.string().min(6).max(1024).required(),
    role: Joi.string(),
  });

  return schema.validate(user);
}

//validatePosts --> helper function to validate user posts

function validateUserPosts(data) {
  const schema = Joi.object({
    posts: Joi.array().min(1).required(),
  });

  return schema.validate(data);
}

exports.User = User;
exports.validateUser = validateUser;
exports.validateUserPosts = validateUserPosts;
