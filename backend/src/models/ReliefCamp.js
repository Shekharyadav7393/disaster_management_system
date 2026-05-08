import mongoose from 'mongoose';

const reliefCampSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      default: [0, 0]
    },
    address: String,
    city: String,
    state: String
  },
  capacity: {
    type: Number,
    required: true
  },
  currentOccupancy: {
    type: Number,
    default: 0
  },
  bedsAvailable: {
    type: Number,
    default: 0
  },
  foodSupply: {
    type: String,
    enum: ['LOW', 'ADEQUATE', 'HIGH'],
    default: 'ADEQUATE'
  },
  medicalSupport: {
    type: Boolean,
    default: false
  },
  resources: {
    food: { type: Number, default: 0 }, // in units or kg
    water: { type: Number, default: 0 }, // in liters
    medicine: { type: Number, default: 0 } // in kits
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'FULL'],
    default: 'ACTIVE'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexing
reliefCampSchema.index({ location: '2dsphere' });

const ReliefCamp = mongoose.model('ReliefCamp', reliefCampSchema);

export default ReliefCamp;
