const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { BadRequestError } = require('../utils/errors');

// Ensure directories exist
const uploadDir = path.join(__dirname, '../../uploads');
const materialsDir = path.join(uploadDir, 'materials');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(materialsDir)) {
  fs.mkdirSync(materialsDir, { recursive: true });
}

// Disk storage configuration for study materials (PDF/PPT/DOC/DOCX)
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, materialsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter for study materials
const materialsFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.ppt', '.pptx', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only PDF, PPT, and DOC files are allowed for study materials.'));
  }
};

const uploadMaterial = multer({
  storage: diskStorage,
  fileFilter: materialsFilter,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_LIMIT) || 10 * 1024 * 1024 // default 10MB
  }
});

// Memory storage for Excel uploads (parsed on-the-fly)
const memoryStorage = multer.memoryStorage();

const excelFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.xlsx' || ext === '.xls') {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only Excel files (.xlsx, .xls) are allowed.'));
  }
};

const uploadExcel = multer({
  storage: memoryStorage,
  fileFilter: excelFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for Excel
  }
});

module.exports = {
  uploadMaterial,
  uploadExcel
};
