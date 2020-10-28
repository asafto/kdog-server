const AWS = require('aws-sdk');
// require('dotenv').config({ path: './config/config.env' });

const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const storage = multerS3({
  s3: s3,
  bucket: 'kdog-storage',
  acl: 'public-read',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    const randomName = Math.random().toString(36).substring(5);
    const key = `${ randomName }__${ path.basename(file.originalname) }`;
    cb(null, key);
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
