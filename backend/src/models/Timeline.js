import mongoose from 'mongoose';

const timelineSchema = new mongoose.Schema({
  disasterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert'
  },
  type: {
    type: String,
    enum: ['alert', 'update', 'mission', 'resolution', 'other'],
    default: 'other'
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Timeline = mongoose.model('Timeline', timelineSchema);

export default Timeline;
