const express = require("express");
const app = express();
const morgan = require("morgan");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRouter = require("./routes/auth");
const usersRouter = require("./routes/users");
const postsRouter = require("./routes/posts");

//getting environment variables (process.env) through dotenv config.env. remove in prod. configuration.
require('dotenv').config({ path: './config/config.env' });

//connecting with mongoose to local mongodb
const MONGODB_URI = process.env.MONGODB_URI || "";
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => console.log("Connected to MongoDB..."))
  .catch((err) => console.error("Could not connect to MongoDB..."));

//Middleware libs
app.use(morgan("combined"));
app.use(cors()); //Server is enabled for all origins - should be changed in production
app.use(cookieParser());
app.use(express.json());

//Routes
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
// app.use("/api/posts", postsRouter);

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Page not found",
  });
});


const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Kdog server is listening on port: ${PORT}...`);
});
