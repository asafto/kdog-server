const jwt = require('jsonwebtoken');

require('dotenv').config({ path: '../config/config.env' });

module.exports = (req, res, next) => {
  const jwtKey = process.env.JWT_TOKEN_KEY;
  const token = req.cookies.token;

  if (!token)
    return res.status(401).send('Access denied. Token was not provided');

  try {
    const decoded = jwt.verify(token, jwtKey);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send('Access denied. Invalid token was provided');
  }
};
