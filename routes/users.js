const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const _ = require('lodash');

const {
  User,
  validateUser,
  validateUserPosts,
} = require('../models/user.model');
const auth_mw = require('../middleware/auth.mw');

//get my user details
router.get('/me', auth_mw, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  res.send(user);
});

//get user details by _id
router.get('/:_id', auth_mw, async (req, res) => {
  const user = await User.findById(req.params._id, (err, user) => {
    if (err)
      return res.status(400).send('An error had occurred. Please try again');

    if (!user)
      res.status(400).send('The user you are trying to fetch does not exist');

    res.send(user);
  }).select('-password');
});

//get all kdog users
router.get('/', auth_mw, async (req, res) => {
  const list = await User.find({}).select('-password');

  if (!list) return res.status(400).send('There are no users in kdog app!');

  res.send(list);
});

//delete user by id
router.delete('/:_id', auth_mw, async (req, res) => {
  const user = await User.findByIdAndRemove(req.params._id, (err, user) => {
    if (err)
      return res.status(400).send('An error had occurred. Please try again');

    if (!user)
      return res
        .status(400)
        .send('The user you are trying to delete does not exist');

    res.send(user);
  });
});

//create new user
router.post('/', async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });
  if (user)
    return res.status(400).send('User with this email already exists');

  user = new User(
    _.pick(req.body, [
      'name',
      'email',
      'password',
      'birthDate',
      'gender',
      'role',
      'posts',
    ])
  );
  //generate hashed password and save user to the db
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user.save();
  res.send(_.pick(user, '_id', 'name', 'email'));
});

module.exports = router;
