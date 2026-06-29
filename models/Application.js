const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const documentSchema = new mongoose.Schema({
  docId: { type: String, default: () => randomUUID() },
  name: { type: String, required: true },
  fileUrl: { type: String, default: null },
  fileName: { type: String, default: null },
  uploadedAt: { type: Date, default: null },
});

const applicantSchema = new mongoose.Schema({
  applicantId: { type: String, default: () => randomUUID() },
  name: { type: String, required: true },
  documents: [documentSchema],
});

const applicationSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  applicants: [applicantSchema],
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
