import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  donorName: {
    type: String,
    required: true
  },
  donorPhone: String,
  donorEmail: String,
  donorType: {
    type: String,
    enum: ['Individual', 'Organization', 'Government'],
    default: 'Individual'
  },
  donationType: {
    type: String,
    enum: ['MONEY', 'ITEM'],
    required: true
  },
  amount: {
    type: Number,
    default: 0
  },
  items: [{
    name: String,
    quantity: Number,
    unit: String
  }],
  campId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReliefCamp'
  },
  disaster: String,
  message: String,
  paymentProvider: {
    type: String,
    default: ""
  },
  paymentOrderId: {
    type: String,
    default: ""
  },
  paymentId: {
    type: String,
    default: ""
  },
  paymentSignature: {
    type: String,
    default: ""
  },
  paymentMode: {
    type: String,
    enum: ['live', 'mock', 'manual', ''],
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Donation = mongoose.model('Donation', donationSchema);

export default Donation;
