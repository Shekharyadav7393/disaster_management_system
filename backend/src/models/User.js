import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['citizen', 'admin', 'super_admin', 'emergency_admin', 'volunteer', 'rescue', 'rescue_team'],
    default: 'citizen'
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
  isVerified: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  trustScore: {
    type: Number,
    default: 100
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'active', 'inactive', 'rejected', 'available', 'deployed', 'on_mission'],
    default: 'active'
  },
  skills: {
    type: [String],
    default: []
  },
  availability: {
    type: String,
    default: ""
  },
  assignedZone: {
    type: String,
    default: ""
  },
  totalHours: {
    type: Number,
    default: 0
  },
  details: {
    bio: {
      type: String,
      default: ""
    },
    emergencyContact: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      relation: { type: String, default: "" }
    }
  },
  activityLog: {
    type: [
      {
        action: { type: String, default: "" },
        location: { type: String, default: "" },
        hours: { type: Number, default: 0 },
        date: { type: Date, default: Date.now }
      }
    ],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexing
userSchema.index({ location: '2dsphere' });

// Password hashing hook
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
