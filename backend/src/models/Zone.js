import mongoose from 'mongoose';

const zoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['flood', 'earthquake', 'fire', 'cyclone', 'landslide', 'gas', 'drought', 'other'],
    required: true
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  boundary: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: {
      type: [[[Number]]], // Array of arrays of arrays of numbers (Lon, Lat)
      required: true
    }
  },
  lastPredictedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

zoneSchema.index({ boundary: '2dsphere' });

const Zone = mongoose.model('Zone', zoneSchema);

export default Zone;
