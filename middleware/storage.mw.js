const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/');
  },
  filename: function (req, filename, cb) {
    const filenameArr = filename.originalname.split('.');
    const fileExtension = filenameArr[filenameArr.length - 1];
    const randomName = Math.random().toString(36).substring(2);
    cb(null, randomName + '.' + fileExtension);
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
