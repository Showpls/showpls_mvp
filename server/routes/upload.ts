import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateEither as authenticate } from '../middleware/telegramAuth';
import { db } from '../db';
import { orders } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Ensure uploads directory exists
const UPLOAD_DIR = 'uploads';
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }
      cb(null, `${UPLOAD_DIR}/`);
    } catch (e) {
      cb(e as Error, `${UPLOAD_DIR}/`);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common document types (including webp)
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype.toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }

    // Mark error on request so route can respond with 400 JSON
    (req as any).fileTypeError = 'Unsupported file type. Allowed: JPEG, PNG, GIF, WEBP, PDF, DOC, DOCX, TXT';
    return cb(null, false);
  }
});

// POST /api/upload - Upload file for chat
router.post('/', authenticate, upload.single('file'), async (req, res) => {
  try {
    const currentUser = req.user;
    const { orderId } = req.body;

    if (!currentUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.file) {
      const typeErr = (req as any).fileTypeError as string | undefined;
      if (typeErr) {
        return res.status(400).json({ error: typeErr });
      }
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID required' });
    }

    // Verify user has access to this order
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      columns: {
        requesterId: true,
        providerId: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const isRequester = order.requesterId === currentUser.id;
    const isProvider = order.providerId === currentUser.id;

    if (!isRequester && !isProvider) {
      return res.status(403).json({ error: 'You do not have access to this order' });
    }

    // Return file URL (in production, this would be a CDN URL)
    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

export default router;
