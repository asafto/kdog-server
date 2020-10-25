const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/');
  },
  filename: function (req, filename, cb) {
    const randomName = Math.random().toString(36).substring(7);
    cb(null, randomName + '__' + filename.originalname);
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
