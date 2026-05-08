import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reporterName: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  disasterType: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'resolved'],
    default: 'pending'
  },
  location: {
    address: String,
    city: String,
    state: String,
    lat: Number,
    lng: Number,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  imageUrl: String,
  videoUrl: String,
  aiAnalysis: {
    isValid: Boolean,
    confidence: Number,
    summary: String,
    suggestedAction: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Report = mongoose.model('Report', reportSchema);

export default Report;
