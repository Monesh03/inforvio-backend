const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Application = require('../models/Application');
const { cloudinary, upload } = require('../utils/cloudinary');

const getOrCreate = async (userId) => {
  let app = await Application.findOne({ userId });
  if (!app) app = await Application.create({ userId, applicants: [] });
  return app;
};

// Get all applicants
router.get('/', auth, async (req, res) => {
  try {
    const app = await getOrCreate(req.user.userId);
    res.json(app.applicants);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add applicant
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const app = await getOrCreate(req.user.userId);
    app.applicants.push({ name });
    await app.save();
    res.status(201).json(app.applicants);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete applicant
router.delete('/:applicantId', auth, async (req, res) => {
  try {
    const app = await getOrCreate(req.user.userId);
    const applicant = app.applicants.find(a => a.applicantId === req.params.applicantId);
    app.applicants = app.applicants.filter(a => a.applicantId !== req.params.applicantId);
    await app.save();
    res.json(app.applicants);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add document (name only)
router.post('/:applicantId/documents', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Document name is required' });
    const app = await getOrCreate(req.user.userId);
    const applicant = app.applicants.find(a => a.applicantId === req.params.applicantId);
    if (!applicant) return res.status(404).json({ message: 'Applicant not found' });
    applicant.documents.push({ name });
    await app.save();
    res.status(201).json(app.applicants);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload file to a document
router.post('/:applicantId/documents/:docId/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const app = await getOrCreate(req.user.userId);
    const applicant = app.applicants.find(a => a.applicantId === req.params.applicantId);
    if (!applicant) return res.status(404).json({ message: 'Applicant not found' });
    const doc = applicant.documents.find(d => d.docId === req.params.docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (doc.publicId) await cloudinary.uploader.destroy(doc.publicId, { resource_type: 'auto' });

    doc.fileUrl = req.file.path;
    doc.fileName = req.file.originalname;
    doc.uploadedAt = new Date();
    await app.save();
    res.json(app.applicants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove uploaded file from a document (keep the document entry)
router.patch('/:applicantId/documents/:docId/remove-file', auth, async (req, res) => {
  try {
    const app = await getOrCreate(req.user.userId);
    const applicant = app.applicants.find(a => a.applicantId === req.params.applicantId);
    if (!applicant) return res.status(404).json({ message: 'Applicant not found' });
    const doc = applicant.documents.find(d => d.docId === req.params.docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    doc.fileUrl = undefined;
    doc.fileName = undefined;
    doc.uploadedAt = undefined;
    await app.save();
    res.json(app.applicants);
  } catch (err) {
    console.error('remove-file error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Delete document
router.delete('/:applicantId/documents/:docId', auth, async (req, res) => {
  try {
    const app = await getOrCreate(req.user.userId);
    const applicant = app.applicants.find(a => a.applicantId === req.params.applicantId);
    if (!applicant) return res.status(404).json({ message: 'Applicant not found' });
    applicant.documents = applicant.documents.filter(d => d.docId !== req.params.docId);
    await app.save();
    res.json(app.applicants);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
