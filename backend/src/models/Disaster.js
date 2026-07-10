import mongoose from 'mongoose';

const disasterSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Disaster type is required'],
      enum: {
        values: ['earthquake', 'flood', 'fire', 'landslide', 'cyclone', 'tsunami', 'other'],
        message: '{VALUE} is not a valid disaster type',
      },
    },
    severity: {
      type: Number,
      required: [true, 'Severity is required'],
      min: [1, 'Severity must be at least 1'],
      max: [5, 'Severity must be at most 5'],
    },
    location: {
      longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
      },
      latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
      },
      address: {
        type: String,
      },
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    affectedArea: {
      type: Number, // in sq km, optional
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [1000, 'Description must be at most 1000 characters'],
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'contained', 'resolved'],
        message: '{VALUE} is not a valid status',
      },
      default: 'active',
    },
    victimCount: {
      type: Number,
      default: 0,
    },
    damageEstimate: {
      type: String,
    },
    media: {
      type: [String],
      default: [],
    },
    assignedTeams: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ResponseTeam' }],
      default: [],
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
disasterSchema.index({ status: 1 });
disasterSchema.index({ type: 1 });
disasterSchema.index({ location: '2dsphere' });
disasterSchema.index({ createdAt: 1 });

// ── Pre-save hook ───────────────────────────────────────────────────────────
disasterSchema.pre('save', function (next) {
  if (
    this.location &&
    typeof this.location.latitude === 'number' &&
    typeof this.location.longitude === 'number'
  ) {
    this.location.type = 'Point';
    this.location.coordinates = [this.location.longitude, this.location.latitude];
  }

  next();
});

// ── Instance Methods ────────────────────────────────────────────────────────
disasterSchema.methods.getTimeActive = function () {
  const start = this.createdAt || new Date();
  const end = this.status === 'resolved' ? (this.updatedAt || new Date()) : new Date();

  const diffMs = end.getTime() - start.getTime();
  const totalMinutes = Math.floor(diffMs / 60000);
  const totalHours = Math.floor(totalMinutes / 60);

  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;

  return { days, hours, minutes };
};

disasterSchema.methods.getNearbyDisasters = async function (radiusKm) {
  const radiusMeters = radiusKm * 1000;

  return this.constructor.find({
    _id: { $ne: this._id },
    status: 'active',
    location: {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: this.location.coordinates || [0, 0],
        },
        $maxDistance: radiusMeters,
      },
    },
  });
};

export default mongoose.model('Disaster', disasterSchema);
