const express = require('express');
const router = express.Router();
const Joi = require('joi');
const bcrypt = require('bcrypt');

const { User } = require('../models/user.model');

router.post('/', async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0]);

  let user = await User.findOne({ email: req.body.email });
  // if (!user) return res.status(400).send('Invalid email or password');
  if (!user) return res.status(400).send('failed on first');


  const validPassword = await bcrypt.compare(req.body.password, user.password);
  // if (!validPassword) return res.status(400).send('Invalid email or password');
  if (!validPassword) return res.status(400).send('failed on second');


  const token = await user.generateAuthToken();

  res.cookie('token', token, { httpOnly: true });

  res.send({ token });
});

function validate(req) {
  const schema = Joi.object({
    email: Joi.string().required().email().min(6).max(255),
    password: Joi.string().required().min(6).max(1024),
  });
  return schema.validate(req);
}

module.exports = router;
