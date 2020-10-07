const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const _ = require('lodash');

const { Post, validatePost } = require('../models/post.model');
const { User } = require('../models/user.model');

const upload = require('../middleware/storage.mw');
const auth = require('../middleware/auth.mw');


//Create a new post
router.post('/', auth, upload.single('image'), async (req, res) => {
  const { error } = validatePost(req.body);

  if (error)
    return res.status(400).send(error.details.map((err) => err.message));

  let post = new Post(_.pick(req.body, ['title', 'text', 'image']));
  post.author = req.user._id;
  post.image = req.file.filename;

  post = await post.save();

  //update posts array in the user document
  await User.findById(post.author._id, async (err, user) => {
    if (err)
      return res
        .status(500)
        .send(`Failed to save the post on ${post.author.name}'s records`);
    if (user) {
      user.posts.push(post._id);
      await user.save();
    }
  });

  res.send(_.pick(post, '_id', 'title', 'author'));
});

module.exports = router;
