import mongoose from 'mongoose';

const sensorReadingSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true
  },
  zoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    required: false
  },
  metrics: {
    waterLevel: { type: Number, default: 0 },
    temperature: { type: Number, default: 0 },
    gasLevel: { type: Number, default: 0 },
    rainfall: { type: Number, default: 0 }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Compound Index: deviceId + timestamp
sensorReadingSchema.index({ deviceId: 1, timestamp: -1 });

const SensorReading = mongoose.model('SensorReading', sensorReadingSchema);

export default SensorReading;

