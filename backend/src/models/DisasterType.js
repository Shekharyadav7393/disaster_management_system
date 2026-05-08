import mongoose from 'mongoose';

const disasterTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  value: String,
  label: String,
  createdAt: { type: Date, default: Date.now }
});

const DisasterType = mongoose.model('DisasterType', disasterTypeSchema);

export default DisasterType;
