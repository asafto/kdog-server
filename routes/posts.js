const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const _ = require('lodash');

const { Post, validatePost } = require('../models/post.model');

const upload = require('../middleware/storage.mw');
const auth = require('../middleware/auth.mw');


module.exports = router;
