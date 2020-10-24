const express = require('express');
const router = express.Router();
const fs = require('fs');
const _ = require('lodash');

const { Post, validatePost } = require('../models/post.model');
const { User } = require('../models/user.model');

const upload = require('../middleware/storage.mw');
const auth = require('../middleware/auth.mw');

//add-remove like
router.post('/:post_id/like', auth, async (req, res) => {
  await Post.findOne({ _id: req.params.post_id }, async (err, post) => {
    if (err)
      return res.status(500).send('An error had occurred. Please try again.');
    if (!post)
      return res
        .status(400)
        .send('The post you are trying to like does not exist.');

    let like_index = post.likes.indexOf(req.user._id);
    if (like_index !== -1) {
      post.likes.splice(like_index, 1);
    } else {
      post.likes.push(req.user._id);
    }
    await post.save();
  });
  Post.findOne({ _id: req.params.post_id }, async (err, post) => {
    res.send(post);
  });
});

//get post image
router.get('/:post_id/:image_name', auth, async (req, res) => {
  // await Post.findOne({ _id: req.params.post_id }, async (err, post) => {
  // if (err)
  //   return res.status(500).send('An error had occurred. Please try again.');
  // if (!post)
  //   return res
  //     .status(400)
  //     .send('The post you are trying to like does not exist.');
  const pathToPostImage = `./public/${req.params.image_name}`;
  fs.readFile(pathToPostImage, async (err, data) => {
    if (err)
      return res.status(500).send('An error had occurred. Please try again.');
    if (!data)
      return res
        .status(400)
        .send('The image you are trying to fetch does not exist.');
    res.send(data);
  });
});

//get post by id
router.get('/:post_id', auth, async (req, res) => {
  await Post.findOne({ _id: req.params.post_id }, async (err, post) => {
    if (err)
      return res.status(500).send('An error had occurred. Please try again.');
    if (!post)
      return res
        .status(400)
        .send('The post you are trying to delete does not exist.');
    res.send(post);
  });
});

//get all posts - open for anonymous users
router.get('/', async (req, res) => {
  const posts = await Post.find({}).sort('-createdAt');
  // .limit(Number(req.query.limit || 20))
  // .skip(Number(req.query.offset || 0));

  // if (posts.length == 0) return res.send('There are no posts in kdog app!');
  if (posts.length == 0) return res.send(null);

  res.send(posts);
});

//update post
router.patch('/:post_id', auth, upload.single('image'), async (req, res) => {
  const { error } = validatePost(req.body);

  if (error)
    return res.status(400).send(error.details.map((err) => err.message));

  await Post.findOneAndUpdate(
    { _id: req.params.post_id },
    _.pick(req.body, 'text', 'image', 'tags'),
    async (err, post) => {
      if (err)
        return res.status(500).send('An error had occurred. Please try again');
      if (!post)
        return res
          .status(400)
          .send('The post you are trying to update does not exist');
      if (req.user.role === 'Regular' && req.user._id != post.author)
        return res
          .status(400)
          .send('A post can be updated only by its author or by Admin user');

      //handle post image update
      if (post.image != req.file.filename) {
        //delete the replaced post image from the public directory
        let pathToPostImage = `./public/${post.image}`;
        fs.unlink(pathToPostImage, (err) => {
          if (err) throw err;
        });

        post.image = req.file.filename;
        post = await post.save();
      }

      //send back the post with the updated information
      post = await Post.findOne({ _id: req.params.post_id });
      res.send(post);
    }
  );
});

//delete post
router.delete('/:post_id', auth, async (req, res) => {
  await Post.findOneAndDelete(
    { _id: req.params.post_id },
    async (err, post) => {
      if (err)
        return res.status(500).send('An error had occurred. Please try again');
      if (!post)
        return res
          .status(400)
          .send('The post you are trying to delete does not exist');

      //allow post deletion only by author or by admin
      if (req.user.role === 'Regular' && req.user._id != post.author)
        return res
          .status(400)
          .send('A post can be deleted only by its author or by Admin user');

      //remove the post from user.posts array
      await User.findOne({ _id: req.user._id }, (err, user) => {
        user.posts.pull(req.params.post_id);
        user.save();
      });

      //delete the post image from the public directory
      let pathToPostImage = `./public/${post.image}`;
      fs.unlink(pathToPostImage, (err) => {
        if (err) throw err;
      });

      res.send(post);
    }
  );
});

//create a new post
router.post('/', auth, upload.single('image'), async (req, res) => {
  const { error } = validatePost(req.body);

  if (error)
    return res.status(400).send(error.details.map((err) => err.message));

  let post = new Post(_.pick(req.body, 'text', 'image', 'tags'));
  post.author = req.user._id;
  post.image = req.file.filename;

  post = await post.save();

  //update posts array in the user document
  await User.findOne({ _id: post.author }, async (err, user) => {
    if (err)
      return res
        .status(500)
        .send(`Failed to save the post on ${req.user.name}'s records`);

    user.posts.push(post._id);
    await user.save();
  });

  res.send(post);
  // res.send(_.pick(post, '_id', 'author', 'createAt');
});

module.exports = router;
