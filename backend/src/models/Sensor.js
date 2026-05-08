import mongoose from 'mongoose';

const sensorSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  zoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  metrics: {
    waterLevel: { type: Number, default: 0 },
    temperature: { type: Number, default: 0 },
    gasLevel: { type: Number, default: 0 },
    rainfall: { type: Number, default: 0 }
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
    address: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

sensorSchema.index({ location: '2dsphere' });

const Sensor = mongoose.model('Sensor', sensorSchema);

export default Sensor;

