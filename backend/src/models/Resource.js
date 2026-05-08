import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  campId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReliefCamp',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['FOOD', 'MEDICINE', 'WATER', 'CLOTHING', 'OTHER'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    default: 'units'
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'LOW', 'OUT_OF_STOCK'],
    default: 'AVAILABLE'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Resource = mongoose.model('Resource', resourceSchema);

export default Resource;