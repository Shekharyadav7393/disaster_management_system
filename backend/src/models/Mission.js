import mongoose from 'mongoose';

const missionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'ULTRA-CRITICAL'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    address: { type: String, default: "" }
  },

  assignedTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  peopleCount: {
    type: Number,
    default: 1
  },
  disasterType: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Mission = mongoose.model('Mission', missionSchema);

export default Mission;
