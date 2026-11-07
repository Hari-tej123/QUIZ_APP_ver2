const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { BadRequestError } = require('../utils/errors');

// Ensure directories exist
const uploadDir = path.join(__dirname, '../../uploads');
const materialsDir = path.join(uploadDir, 'materials');
const educatorProofDir = path.join(__dirname, '../../private_uploads/educator-proofs');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(materialsDir)) {
  fs.mkdirSync(materialsDir, { recursive: true });
}
if (!fs.existsSync(educatorProofDir)) {
  fs.mkdirSync(educatorProofDir, { recursive: true });
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
  if (['.xlsx', '.xls', '.csv'].includes(ext)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only Excel files (.xlsx, .xls) are allowed.'));
  }
};

const questionUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const supported = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp'
    };
    if (supported[ext] === file.mimetype) return cb(null, true);
    cb(new BadRequestError('Question images must be PNG, JPEG, or WebP files.'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

const educatorProofUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, educatorProofDir),
    filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
  }),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg'];
    const mimeTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    if (allowed.includes(ext) && mimeTypes.includes(file.mimetype)) return cb(null, true);
    cb(new BadRequestError('Proof must be a PDF, PNG, or JPEG file.'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadExcel = multer({
  storage: memoryStorage,
  fileFilter: excelFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for Excel
  }
});

module.exports = {
  uploadMaterial,
  uploadExcel,
  questionUpload,
  educatorProofUpload
};
