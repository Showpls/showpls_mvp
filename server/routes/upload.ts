import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateEither as authenticate } from '../middleware/telegramAuth';
import { db } from '../db';
import { orders } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
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
    // Allow images and common document types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
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
