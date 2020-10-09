const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const _ = require('lodash');

const {
  User,
  validateUser,
  validateUserPosts,
} = require('../models/user.model');
const auth = require('../middleware/auth.mw');

const { Post } = require('../models/post.model');

//get my user details
router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  res.send(user);
});

//get user details by _id
router.get('/:_id', auth, async (req, res) => {
  if (req.user.role === 'Regular' && req.params._id !== req.user._id)
    return res
      .status(400)
      .send(
        'User details can be retrieved only by the same user or by Admin user'
      );

  const user = await User.findOne({ _id: req.params._id }, (err, user) => {
    if (err)
      return res.status(400).send('An error had occurred. Please try again');

    if (!user)
      res.status(400).send('The user you are trying to fetch does not exist');

    res.send(user);
  }).select('-password');
});

//get all user posts based on user id
router.get('/:_id/posts', async (req, res) => {
  if (!req.params._id)
    return res.status(400).send('You must provide a user id');
  await User.findOne({ _id: req.params._id }, async (err, user) => {
    if (err) return res.status(400).send('Such user does not exit');

    const { error } = validateUserPosts(user);
    if (error)
      return res.status(400).send(error.details.map((err) => err.message));

    const posts = await Post.find({ _id: { $in: user.posts } })
      .select('-__v')
      .sort('-createdAt')
      .limit(Number(req.query.limit || 10))
      .skip(Number(req.query.offset || 0));
    
    if (posts.length == 0) return res.send('There are no users in kdog app!');
    
    res.send(posts);
  });
});

//get all kdog users
router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'Admin')
    return res
      .status(400)
      .send('Users information can be retrieved only by Admin user');

  const list = await User.find({})
    .select('-password')
    .sort('name')
    .limit(Number(req.query.limit || 20))
    .skip(Number(req.query.offset || 0));

  if (!list) return res.status(400).send('There are no users in kdog app!');

  res.send(list);
});

//update user details

router.patch('/:_id', auth, async (req, res) => {
  if (req.user.role === 'Regular' && req.params._id !== req.user._id)
    return res
      .status(400)
      .send(
        'User details can be updated only by the same user or by Admin user'
      );

  const { error } = validateUser(req.body);

  if (error)
    return res.status(400).send(error.details.map((err) => err.message));

  await User.findOneAndUpdate(
    { _id: req.params._id },
    _.pick(req.body, [
      'name',
      'email',
      'password',
      'birthDate',
      'gender',
      'role',
      'posts',
    ]),
    async (err, user) => {
      if (err)
        return res.status(400).send('An error had occured. Please try again.');

      if (!user)
        return res
          .status(400)
          .send('The user you are trying to update does not exist.');

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);

      user.save(); //needs to improve - redundent with findOneAndUpdate
      res.send(_.pick(user, '_id', 'name', 'email'));
    }
  );
});

//delete user by id
router.delete('/:_id', auth, async (req, res) => {
  if (req.user.role === 'Regular' && req.params._id !== req.user._id)
    return res
      .status(400)
      .send('User can be deleted only by the same user or by Admin user');

  const user = await User.findOneAndDelete(
    { _id: req.params._id },
    async (err, user) => {
      if (err)
        return res.status(400).send('An error had occurred. Please try again');

      if (!user)
        return res
          .status(400)
          .send('The user you are trying to delete does not exist');
      //delete all the deleted user posts
      await Post.deleteMany({ author: user._id }, (err) => {
        if (err) return res.status(500).send(err.message);
      });

      res.send(user);
    }
  ).select('-password');
});

//create new user
router.post('/', async (req, res) => {
  const { error } = validateUser(req.body);

  if (error)
    return res.status(400).send(error.details.map((err) => err.message));

  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send('User with this email already exists');

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
