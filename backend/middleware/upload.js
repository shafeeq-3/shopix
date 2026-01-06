const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + req.user._id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter - only images
const fileFilter = (req, file, cb) => {
  console.log('File received:', file.originalname, 'MIME:', file.mimetype);
  
  // Allow common image MIME types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/jfif' // JFIF is JPEG format
  ];
  
  // Allow common image extensions
  const allowedExtensions = /\.(jpeg|jpg|png|gif|webp|jfif)$/i;
  
  const hasValidMime = allowedMimeTypes.includes(file.mimetype);
  const hasValidExt = allowedExtensions.test(file.originalname);

  if (hasValidMime || hasValidExt) {
    console.log('File accepted');
    return cb(null, true);
  } else {
    console.log('File rejected - Extension:', file.originalname, 'MIME:', file.mimetype);
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

module.exports = upload;
