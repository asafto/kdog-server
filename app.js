const express = require('express');
const app = express();
const path = require('path');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const postsRouter = require('./routes/posts');
const commentsRouter = require('./routes/comments');

//getting environment variables (process.env) through dotenv config.env. remove in prod. configuration.
// require('dotenv').config({ path: './config/config.env' });

//connecting with mongoose to local mongodb
const MONGODB_URI = process.env.MONGODB_URI || '';
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log(`Connected to MongoDB @ ${MONGODB_URI}...`))
  .catch((err) => console.error('Could not connect to MongoDB...'));

//Middleware libs
app.use(morgan('dev'));
app.use(cors()); //Server is enabled for all origins - should be changed in production
app.use(cookieParser());
// app.use('/public', express.static(path.resolve(__dirname, './public'))); // allows service static files (images) from the public folder
app.use('/tmp', express.static(path.resolve(__dirname, './tmp'))); // allows service static files (images) from the public folder
app.use(express.json()); // express mw for converting json to javascript objects

//Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Page not found',
  });
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(
    `Kdog server connected. Send requests through http://localhost:${PORT} ...`
  );
});
