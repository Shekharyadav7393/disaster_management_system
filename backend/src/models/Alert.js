import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    disasterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Disaster',
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: [500, 'Message must be at most 500 characters'],
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
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    urgency: {
      type: String,
      required: [true, 'Urgency is required'],
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: '{VALUE} is not a valid urgency level',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['sent', 'acknowledged', 'assigned', 'resolved'],
        message: '{VALUE} is not a valid status',
      },
      default: 'sent',
    },
    assignedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResponseTeam',
    },
    estimatedArrivalTime: {
      type: Number, // in minutes, optional
    },
    resolutionNotes: {
      type: String,
    },
    responseTime: {
      type: Number, // in seconds, calculated
    },
    acknowledgedAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
alertSchema.index({ userId: 1 });
alertSchema.index({ status: 1 });
alertSchema.index({ urgency: 1 });
alertSchema.index({ location: '2dsphere' });
alertSchema.index({ createdAt: 1 });

// ── Pre-save: sync coordinates inside location ──────────────────────────────
alertSchema.pre('save', function (next) {
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

// ── Instance Methods ─────────────────────────────────────────────────────────
alertSchema.methods.getResponseTime = function () {
  if (!this.acknowledgedAt) return null;
  const start = this.createdAt || new Date();
  return Math.round((this.acknowledgedAt.getTime() - start.getTime()) / 1000);
};

alertSchema.methods.markAsAcknowledged = async function () {
  this.status = 'acknowledged';
  this.acknowledgedAt = new Date();
  const start = this.createdAt || new Date();
  this.responseTime = Math.round((this.acknowledgedAt.getTime() - start.getTime()) / 1000);
  await this.save();
  return this;
};

alertSchema.methods.markAsResolved = async function (notes) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  if (notes) {
    this.resolutionNotes = notes;
  }
  await this.save();
  return this;
};

export default mongoose.model('Alert', alertSchema);
