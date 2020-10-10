const express = require('express');
const router = express.Router();
const fs = require('fs');
const _ = require('lodash');

const { Post, validatePost } = require('../models/post.model');
const { User } = require('../models/user.model');
const { Comment, validateComment } = require('../models/comment.model');

const upload = require('../middleware/storage.mw');
const auth = require('../middleware/auth.mw');

//get all post comments - open for anonymous users
router.get('/:post_id/comments', async (req, res) => {
  if (!req.params.post_id)
    return res.status(400).send('You must provide a user id');
  await Post.findOne({ _id: req.params.post_id }, async (err, post) => {
    if (err)
      return res.status(500).send('an error had occurred. Please try again.');
    if (!post)
      return res
        .status(400)
        .send('The post you are looking for does not exist.');

    const comments = await Comment.find({ _id: { $in: post.comments } })
      .select('-__v')
      .sort('createdAt')
      .limit(Number(req.query.limit || 10))
      .skip(Number(req.query.offset || 0));

    if (comments.length == 0)
      return res.send(`There are no comments for post id ${post._id}`);

    res.send(comments);
  });
});

//update comment
router.patch('/:comment_id', auth, upload.single('image'), async (req, res) => {
  const { error } = validateComment(req.body);

  if (error)
    return res.status(400).send(error.details.map((err) => err.message));

  await Comment.findOneAndUpdate(
    { _id: req.params.comment_id },
    _.pick(req.body, 'text', 'image'),
    async (err, comment) => {
      if (err)
        return res.status(500).send('An error had occurred. Please try again');
      if (!comment)
        return res
          .status(400)
          .send('The comment you are trying to update does not exist');

      //allow comment editing only by its author or by admin
      if (req.user.role === 'Regular' && req.user._id != comment.author)
        return res
          .status(400)
          .send('A comment can be updated only by its author or by Admin user');

      //handle comment image update
      if (comment.image != req.file.filename) {
        //delete the replaced comment image from the public directory
        let pathToCommentImage = `./public/${comment.image}`;
        fs.unlink(pathToCommentImage, (err) => {
          if (err) throw err;
        });
        comment.image = req.file.filename;
        comment = await comment.save();
      }

      //send back the comment with the updated information
      comment = await Comment.findOne({ _id: req.params.comment_id });
      res.send(comment);
    }
  );
});

//delete comment
router.delete('/:comment_id', auth, async (req, res) => {
  await Comment.findOneAndDelete(
    { _id: req.params.comment_id },
    async (err, comment) => {
      if (err)
        return res.status(500).send('An error had occurred. Please try again');
      if (!comment)
        return res
          .status(400)
          .send('The comment you are trying to delete does not exist');
      const post = await Post.findOne({ _id: comment.post });
      //allow comment deletion only by comment and post authors or by admin
      // res.send(comment);
      if (
        req.user.role === 'Regular' &&
        req.user._id != post.author &&
        req.user._id != comment.author
      )
        return res
          .status(400)
          .send('A post can be deleted only by its author or by Admin user');

      //remove comment from post.comments array
      await post.comments.pull(req.params.comment_id);
      await post.save();

      //delete the post image from the public directory
      let pathToCommentImage = `./public/${comment.image}`;
      fs.unlink(pathToCommentImage, (err) => {
        if (err) throw err;
      });

      res.send(comment);
    }
  );
});

//add comment
router.post('/:post_id', auth, upload.single('image'), async (req, res) => {
  const { error } = validateComment(req.body);

  if (error)
    return res.status(400).send(error.details.map((err) => err.message));

  await Post.findOne({ _id: req.params.post_id }, async (err, post) => {
    if (err)
      return res.status(500).send('An error had occurred. Please try again.');
    if (!post)
      return res
        .status(400)
        .send('The post you are trying to comment on does not exist.');

    let comment = new Comment(_.pick(req.body, ['text', 'image']));
    comment.post = req.params.post_id;
    comment.author = req.user._id;
    comment.image = req.file.filename;

    await comment.save();
    //update comments array in the post document
    await Post.findOne({ _id: req.params.post_id }, async (err, post) => {
      if (err)
        return res
          .status(500)
          .send(`Failed to save the comment on post ${post._id}`);

      post.comments.push(comment._id);
      await post.save();
    });
    res.send(_.pick(comment, '_id', 'post', 'author', 'createAt'));
  });
});

module.exports = router;
