const multer = require('multer');
const path = require('path');
const fs = require('fs');

function createStorage(folder) {
  return multer.diskStorage({
    destination: function(req, file, cb) {
      const dir = path.join(__dirname, '../public/uploads/', folder);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: function(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
    }
  });
}

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น'));
};

const uploadProduct = multer({ storage: createStorage('products'), fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadProfile = multer({ storage: createStorage('profiles'), fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = { uploadProduct, uploadProfile };
