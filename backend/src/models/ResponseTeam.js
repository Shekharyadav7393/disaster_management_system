import mongoose from 'mongoose';

const responseTeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    type: {
      type: String,
      required: [true, 'Team type is required'],
      enum: {
        values: ['fire', 'medical', 'police', 'rescue', 'ngo', 'other'],
        message: '{VALUE} is not a valid team type',
      },
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Team leader is required'],
    },
    members: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      validate: {
        validator: function (arr) {
          return arr && arr.length >= 1;
        },
        message: 'A response team must have at least 1 member.',
      },
      required: [true, 'Team members are required'],
    },
    currentLocation: {
      longitude: { type: Number },
      latitude: { type: Number },
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    vehicles: [
      {
        model: { type: String },
        registrationNumber: { type: String },
        capacity: { type: Number },
      },
    ],
    equipment: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: ['available', 'on_duty', 'unavailable'],
        message: '{VALUE} is not a valid status',
      },
      default: 'available',
    },
    assignedDisasters: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Disaster' }],
      default: [],
    },
    completedMissions: {
      type: Number,
      default: 0,
    },
    organization: {
      type: String,
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
responseTeamSchema.index({ type: 1 });
responseTeamSchema.index({ status: 1 });
responseTeamSchema.index({ leader: 1 });

// ── Pre-save: sync coordinates from currentLocation ─────────────────────────
responseTeamSchema.pre('save', function (next) {
  if (
    this.currentLocation &&
    typeof this.currentLocation.latitude === 'number' &&
    typeof this.currentLocation.longitude === 'number'
  ) {
    this.currentLocation.type = 'Point';
    this.currentLocation.coordinates = [this.currentLocation.longitude, this.currentLocation.latitude];
  }
  next();
});

// ── Instance Methods ─────────────────────────────────────────────────────────
responseTeamSchema.methods.assignToDisaster = async function (disasterId) {
  if (!this.assignedDisasters.includes(disasterId)) {
    this.assignedDisasters.push(disasterId);
  }
  this.status = 'on_duty';
  await this.save();
  return this;
};

responseTeamSchema.methods.updateLocation = async function (latitude, longitude) {
  this.currentLocation = {
    latitude,
    longitude,
    type: 'Point',
    coordinates: [longitude, latitude],
  };
  await this.save();
  return this;
};

responseTeamSchema.methods.completeAssignment = async function (disasterId) {
  this.assignedDisasters.pull(disasterId);
  this.completedMissions += 1;
  if (this.assignedDisasters.length === 0) {
    this.status = 'available';
  }
  await this.save();
  return this;
};

export default mongoose.model('ResponseTeam', responseTeamSchema);
