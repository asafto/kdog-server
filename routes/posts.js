const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const _ = require('lodash');

const { Post, validatePost } = require('../models/post.model');
const { User } = require('../models/user.model');

const upload = require('../middleware/storage.mw');
const auth = require('../middleware/auth.mw');

router.patch('/:_id', auth, upload.single('image'), async (req, res) => {

  const { error } = validatePost(req.body);

  if (error)
    return res.status(400).send(error.details.map((err) => err.message));
  
  await Post.findOneAndUpdate(
    { _id: req.params._id },
    req.body,
    async (err, post) => {
      if (err)
        return res.status(500).send('An error had occurred. Please try again');
      if (!post)
        return res
          .status(400)
          .send('The post you are trying to delete does not exist');
      if (req.user.role === 'Regular' && req.user._id != post.author)
        return res
          .status(400)
          .send('A post can be updated only by its author or by Admin user');
      
      if (post.image != req.file.filename) {
        post.image = req.file.filename;
        post = await post.save();
      }
      
      //send back the post with the updated information
      post = await Post.findOne({ _id: req.params._id });
      res.send(post);
    }
  );
});

//delete post
router.delete('/:_id', auth, async (req, res) => {
  await Post.findOneAndDelete({ _id: req.params._id }, async (err, post) => {
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
      user.posts.pull(req.params._id);
      user.save();
    });

    res.send(post);
  });
});

// router.delete('/:_id', auth, async (req, res) => {
//   await Post.findOne({ _id: req.params._id }, async (err, post) => {
//     if (err)
//       return res.status(500).send('An error had occurred. Please try again');
//     if (!post)
//       return res
//         .status(400)
//         .send('The post you are trying to delete does not exist');

//     //allow post deletion only by author or by admin
//     if (req.user.role === 'Regular' && req.user._id != post.author)
//       return res
//         .status(400)
//         .send('A post can be deleted only by its author or by Admin user');

//     await Post.deleteOne({ _id: req.params._id }, async (err, post) => {
//       if (post) {
//         await User.findOne({ _id: req.user._id }, (err, user) => {
//           user.posts.pull(req.params._id);
//           user.save();
//         });
//       }
//     });
//     res.send(post);
//   });
// });

//create a new post
router.post('/', auth, upload.single('image'), async (req, res) => {
  const { error } = validatePost(req.body);

  if (error)
    return res.status(400).send(error.details.map((err) => err.message));

  let post = new Post(_.pick(req.body, ['title', 'text', 'image']));
  post.author = req.user._id;
  post.image = req.file.filename;

  post = await post.save();

  //update posts array in the user document
  await User.findById(post.author, async (err, user) => {
    if (err)
      return res
        .status(500)
        .send(`Failed to save the post on ${post.author.name}'s records`);

    user.posts.push(post._id);
    await user.save();
  });

  res.send(_.pick(post, '_id', 'title', 'author'));
});

module.exports = router;
