import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  sosId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SOS',
    default: null
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    default: null
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  professionalism: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  responseTime: {
    type: String,
    enum: ['fast', 'moderate', 'slow'],
    default: 'moderate'
  },
  comment: {
    type: String,
    maxlength: 500,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate reviews for the same SOS/Request
reviewSchema.index({ user: 1, sosId: 1 }, { unique: true, sparse: true });
reviewSchema.index({ user: 1, requestId: 1 }, { unique: true, sparse: true });
reviewSchema.index({ team: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
